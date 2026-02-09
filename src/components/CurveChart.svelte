<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import katex from 'katex';
  import { clamp } from '../lib/math.js';

  let {
    title = '',
    titleTex = '',
    controlPointYs = $bindable([]),
    gridValues = [],
    gridX = [],
    editable = false,
    colorFn = () => '#888',
    yMax = $bindable(null),
    maxDragY = Infinity,
    domain = [0, 1],
    onchange = null,
  } = $props();

  let container;
  let width = $state(400);
  const height = 220;
  const margin = { top: 30, right: 20, bottom: 36, left: 50 };

  let chartWidth = $derived(width - margin.left - margin.right);
  let chartHeight = $derived(height - margin.top - margin.bottom);

  // Compute effective yMax from gridValues
  let effectiveYMax = $derived.by(() => {
    if (yMax !== null) return yMax;
    const maxVal = Math.max(...gridValues, 0.1);
    return maxVal * 1.15;
  });

  // D3 scales
  let xScale = $derived(
    d3.scaleLinear().domain(domain).range([0, chartWidth])
  );
  let yScale = $derived(
    d3.scaleLinear().domain([0, effectiveYMax]).range([chartHeight, 0])
  );

  // Control point x-coordinates
  let controlPointXs = $derived(
    controlPointYs.map((_, i) =>
      domain[0] + (i / (controlPointYs.length - 1)) * (domain[1] - domain[0])
    )
  );

  // Display y-values: sample gridValues at control point positions so dots sit on the curve
  // (handles normalization mismatch, e.g. prior density must integrate to 1)
  let controlPointDisplayYs = $derived(
    controlPointYs.map((cy, i) => {
      if (gridValues.length === 0) return cy;
      const t = i / Math.max(1, controlPointYs.length - 1);
      const gridIdx = Math.round(t * (gridValues.length - 1));
      return gridValues[gridIdx] ?? cy;
    })
  );

  // Generate area path from grid
  let areaPath = $derived.by(() => {
    if (gridValues.length === 0 || gridX.length === 0) return '';
    const area = d3.area()
      .x((_, i) => xScale(gridX[i]))
      .y0(chartHeight)
      .y1((d) => yScale(Math.max(0, d)))
      .curve(d3.curveMonotoneX);
    return area(gridValues);
  });

  // Line path (top of curve)
  let linePath = $derived.by(() => {
    if (gridValues.length === 0 || gridX.length === 0) return '';
    const line = d3.line()
      .x((_, i) => xScale(gridX[i]))
      .y((d) => yScale(Math.max(0, d)))
      .curve(d3.curveMonotoneX);
    return line(gridValues);
  });

  // Get fill color at midpoint density
  let fillColor = $derived.by(() => {
    const midIdx = Math.floor(gridValues.length / 2);
    const midVal = gridValues[midIdx] || 0;
    const normVal = effectiveYMax > 0 ? clamp(midVal / effectiveYMax, 0, 1) : 0;
    return colorFn(normVal);
  });

  let strokeColor = $derived.by(() => {
    return colorFn(0.8);
  });

  // X-axis ticks
  let xTicks = $derived.by(() => {
    const [a, b] = domain;
    const tickGen = d3.scaleLinear().domain([a, b]).range([0, chartWidth]);
    return tickGen.ticks(6).map(v => ({ value: v, x: xScale(v) }));
  });

  // Y-axis ticks
  let yTicks = $derived.by(() => {
    const tickGen = d3.scaleLinear().domain([0, effectiveYMax]).range([chartHeight, 0]);
    return tickGen.ticks(4).map(v => ({ value: v, y: yScale(v) }));
  });

  // Drag state
  let dragging = $state(false);
  let dragIndex = $state(-1);
  let influenceSigma = $state(0);    // 0 = single point, >0 = Gaussian width in index-space
  let dragInitialYs = $state([]);    // snapshot at drag start
  let dragStartVal = $state(0);      // mouse y-value at drag start (for relative delta)
  let svgEl = $state(null);

  const SINGLE_POINT_THRESHOLD = 7;  // pixels: within this = directly on point

  // Hover influence preview
  let hoverWeights = $state([]);

  function handleChartPointerDown(event) {
    if (!editable || controlPointYs.length === 0) return;

    const svgRect = svgEl.getBoundingClientRect();
    const mouseX = event.clientX - svgRect.left - margin.left;
    const mouseY = event.clientY - svgRect.top - margin.top;

    // Ignore clicks outside chart area
    if (mouseX < 0 || mouseX > chartWidth || mouseY < 0 || mouseY > chartHeight + 5) return;

    event.preventDefault();

    // Find nearest control point by x-coordinate
    let nearestIdx = 0;
    let minDist = Infinity;
    controlPointXs.forEach((cx, i) => {
      const dist = Math.abs(mouseX - xScale(cx));
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    });

    dragging = true;
    dragIndex = nearestIdx;
    dragInitialYs = [...controlPointYs];
    dragStartVal = Math.max(0, yScale.invert(mouseY));

    // Vertical pixel distance from the displayed control point center
    const pointPixelY = yScale(Math.max(0, controlPointDisplayYs[nearestIdx]));
    const yOffset = Math.abs(mouseY - pointPixelY);

    if (yOffset < SINGLE_POINT_THRESHOLD) {
      influenceSigma = 0; // single point
    } else {
      // Convert pixel offset to index-space sigma via point density
      const pixelsPerPoint = chartWidth / Math.max(1, controlPointYs.length - 1);
      influenceSigma = (yOffset - SINGLE_POINT_THRESHOLD) / pixelsPerPoint * 0.8;
    }

    // Show influence weights during drag
    hoverWeights = weightsFromSigma(nearestIdx, influenceSigma);
  }

  function onPointerMove(event) {
    if (!dragging || dragIndex < 0 || !svgEl) return;

    const svgRect = svgEl.getBoundingClientRect();
    const mouseY = event.clientY - svgRect.top - margin.top;
    const newCenterVal = clamp(yScale.invert(mouseY), 0, maxDragY);

    if (influenceSigma === 0) {
      // Single point drag
      const newYs = [...controlPointYs];
      newYs[dragIndex] = newCenterVal;
      controlPointYs = newYs;
    } else {
      // Multi-point drag with Gaussian falloff — delta relative to drag start, not point
      const delta = newCenterVal - dragStartVal;
      const twoSigmaSq = 2 * influenceSigma * influenceSigma;
      controlPointYs = dragInitialYs.map((y, i) => {
        const d = Math.abs(i - dragIndex);
        if (d === 0) return clamp(y + delta, 0, maxDragY);
        const weight = Math.exp(-(d * d) / twoSigmaSq);
        if (weight < 0.001) return y; // skip negligible influence
        return clamp(y + delta * weight, 0, maxDragY);
      });
    }

    onchange?.();
  }

  function endDrag() {
    dragging = false;
    dragIndex = -1;
    influenceSigma = 0;
    dragInitialYs = [];
    dragStartVal = 0;
    hoverWeights = [];
  }

  // Compute weights from a center index and sigma (used by both hover and drag)
  function weightsFromSigma(centerIdx, sigma) {
    return controlPointYs.map((_, i) => {
      const d = Math.abs(i - centerIdx);
      if (d === 0) return 1;
      if (sigma === 0) return 0;
      const twoSigmaSq = 2 * sigma * sigma;
      const w = Math.exp(-(d * d) / twoSigmaSq);
      return w < 0.001 ? 0 : w;
    });
  }

  // Compute influence weights for a given mouse position
  function computeInfluenceWeights(mouseX, mouseY) {
    let nearestIdx = 0;
    let minDist = Infinity;
    controlPointXs.forEach((cx, i) => {
      const dist = Math.abs(mouseX - xScale(cx));
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    });

    const pointPixelY = yScale(Math.max(0, controlPointDisplayYs[nearestIdx]));
    const yOffset = Math.abs(mouseY - pointPixelY);

    let sigma;
    if (yOffset < SINGLE_POINT_THRESHOLD) {
      sigma = 0;
    } else {
      const pixelsPerPoint = chartWidth / Math.max(1, controlPointYs.length - 1);
      sigma = (yOffset - SINGLE_POINT_THRESHOLD) / pixelsPerPoint * 0.8;
    }

    return weightsFromSigma(nearestIdx, sigma);
  }

  function handleChartPointerMove(event) {
    if (dragging || !editable || controlPointYs.length === 0) return;

    const svgRect = svgEl.getBoundingClientRect();
    const mouseX = event.clientX - svgRect.left - margin.left;
    const mouseY = event.clientY - svgRect.top - margin.top;

    if (mouseX < 0 || mouseX > chartWidth || mouseY < 0 || mouseY > chartHeight + 5) {
      hoverWeights = [];
      return;
    }

    hoverWeights = computeInfluenceWeights(mouseX, mouseY);
  }

  function handleChartPointerLeave() {
    if (!dragging) {
      hoverWeights = [];
    }
  }

  // Resize observer
  onMount(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        width = entry.contentRect.width;
      }
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  });

  // Render title with KaTeX
  let titleEl = $state(null);
  $effect(() => {
    if (titleEl && titleTex) {
      katex.render(titleTex, titleEl, { throwOnError: false, trust: true });
    }
  });

  function formatTick(val) {
    if (val === 0) return '0';
    if (Number.isInteger(val)) return val.toString();
    return val.toFixed(2);
  }
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={endDrag} />

<div class="curve-chart" bind:this={container}>
  <h3 style="padding-left: {margin.left}px;">
    {#if titleTex}
      <span bind:this={titleEl}></span>
    {:else}
      {title}
    {/if}
  </h3>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <svg
    bind:this={svgEl}
    {width}
    {height}
    class:editable
    onpointerdown={handleChartPointerDown}
    onpointermove={handleChartPointerMove}
    onpointerleave={handleChartPointerLeave}
  >
    <g transform="translate({margin.left}, {margin.top})">
      <!-- Y-axis grid lines -->
      {#each yTicks as tick}
        <line
          x1="0"
          y1={tick.y}
          x2={chartWidth}
          y2={tick.y}
          class="grid-line"
        />
        <text
          x="-8"
          y={tick.y}
          text-anchor="end"
          dominant-baseline="middle"
          class="tick-label"
        >
          {formatTick(tick.value)}
        </text>
      {/each}

      <!-- Area fill -->
      {#if areaPath}
        <path
          d={areaPath}
          fill={fillColor}
          opacity="0.3"
        />
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          stroke-width="2"
        />
      {/if}

      <!-- Control points -->
      {#if editable}
        {#each controlPointDisplayYs as cy, i}
            <circle
            cx={xScale(controlPointXs[i])}
            cy={yScale(Math.max(0, cy))}
            r={dragging && dragIndex === i && influenceSigma === 0 ? 7 : Math.max(2.5, 6 - controlPointYs.length / 15)}
            class="control-point"
            class:active={dragging && dragIndex === i && influenceSigma === 0}
            fill={strokeColor}
            fill-opacity={0.45 + (hoverWeights[i] || 0) * 0.55}
            stroke={strokeColor}
            stroke-opacity={0.15 + (hoverWeights[i] || 0) * 0.85}
            stroke-width="1.5"
          />
        {/each}
      {/if}

      <!-- X axis -->
      <line
        x1="0"
        y1={chartHeight}
        x2={chartWidth}
        y2={chartHeight}
        class="axis"
      />
      {#each xTicks as tick}
        <line
          x1={tick.x}
          y1={chartHeight}
          x2={tick.x}
          y2={chartHeight + 5}
          class="axis"
        />
        <text
          x={tick.x}
          y={chartHeight + 18}
          text-anchor="middle"
          class="tick-label"
        >
          {formatTick(tick.value)}
        </text>
      {/each}

      <!-- Y axis -->
      <line
        x1="0"
        y1="0"
        x2="0"
        y2={chartHeight}
        class="axis"
      />

      <!-- Axis labels -->
      <text
        x={chartWidth / 2}
        y={chartHeight + 32}
        text-anchor="middle"
        class="axis-label"
      >z</text>
    </g>
  </svg>
</div>

<style>
  .curve-chart {
    flex: 1;
    min-width: 0;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  svg {
    display: block;
  }

  svg.editable {
    cursor: crosshair;
  }

  .grid-line {
    stroke: var(--border-subtle);
    stroke-dasharray: 2 4;
  }

  .axis {
    stroke: var(--axis-color);
  }

  .tick-label {
    font-size: 10px;
    fill: var(--text-faint);
    font-family: 'SF Mono', 'Monaco', monospace;
  }

  .axis-label {
    font-size: 11px;
    fill: var(--text-muted);
    font-style: italic;
  }

  .control-point {
    cursor: ns-resize;
    transition: r 0.1s ease;
  }

  .control-point:hover {
    r: 7;
  }

  .control-point.active {
    filter: brightness(1.3);
  }
</style>
