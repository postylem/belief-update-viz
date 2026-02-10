<script>
  import { onMount } from 'svelte';
  import { scaleLinear, scaleBand } from 'd3';
  import katex from 'katex';
  import { clamp, formatNumber } from '../lib/math.js';

  // Props
  let {
    title = '',
    titleTex = '',  // LaTeX version of title
    values = $bindable([]),
    labels = [],
    editable = false,
    colorFn = () => '#888',
    minValue = 0,
    maxValue = 1,
    useLogScale = false,
    showValues = true,
    isPrior = false,
    secondaryValues = null, // For posterior: [priorValues, likelihoodValues]
  } = $props();

  // Internal state
  let container;
  let width = $state(400);
  let inputValues = $state([]);

  // Sync inputValues with values when values change externally
  $effect(() => {
    inputValues = values.map(v => formatNumber(v, 4));
  });

  // Measure actual label widths to set left margin dynamically
  let labelMeasureEl = $state(null);
  let measuredLabelWidth = $derived.by(() => {
    if (!labelMeasureEl) return 30;
    const effectiveLabels = labels.length ? labels : values.map((_, i) => `State ${i + 1}`);
    let maxW = 0;
    for (const label of effectiveLabels) {
      labelMeasureEl.textContent = label;
      const w = labelMeasureEl.getComputedTextLength();
      if (w > maxW) maxW = w;
    }
    return Math.ceil(maxW);
  });

  // Dimensions - left margin adapts to label width
  let margin = $derived({
    top: 4,
    right: editable ? 56 : 40,
    bottom: 8,
    left: measuredLabelWidth + 12,
  });

  // Compute chart dimensions - larger bars for <= 3 items
  let barHeight = $derived(values.length <= 3 ? 32 : 24);
  let chartWidth = $derived(width - margin.left - margin.right);
  let chartHeight = $derived(Math.max(values.length * barHeight, 80));

  // Scales
  let xScale = $derived(
    scaleLinear()
      .domain([0, maxValue])
      .range([0, chartWidth])
  );

  let yScale = $derived(
    scaleBand()
      .domain(labels.length ? labels : values.map((_, i) => `State ${i + 1}`))
      .range([0, chartHeight])
      .padding(0.12)
  );

  // Log scale for slider mapping (when useLogScale is true)
  function linearToLog(linear, min, max) {
    if (min <= 0) min = 1e-10;
    const logMin = Math.log(min);
    const logMax = Math.log(max);
    const logVal = logMin + linear * (logMax - logMin);
    return Math.exp(logVal);
  }

  function logToLinear(value, min, max) {
    if (min <= 0) min = 1e-10;
    if (value <= 0) value = min;
    const logMin = Math.log(min);
    const logMax = Math.log(max);
    return (Math.log(value) - logMin) / (logMax - logMin);
  }

  // Handle drag on bar
  function handleDrag(index, event) {
    if (!editable) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left - margin.left;
    const linearRatio = clamp(x / chartWidth, 0, 1);

    let newValue;
    if (useLogScale && minValue > 0) {
      newValue = linearToLog(linearRatio, minValue, maxValue);
    } else {
      newValue = linearRatio * maxValue;
    }

    newValue = clamp(newValue, minValue, maxValue);
    updateValue(index, newValue);
  }

  // Update a single value
  function updateValue(index, newValue) {
    const newValues = [...values];
    newValues[index] = newValue;

    if (isPrior) {
      // Normalize prior values
      const sum = newValues.reduce((a, b) => a + b, 0);
      if (sum > 0) {
        values = newValues.map(v => v / sum);
      }
    } else {
      values = newValues;
    }
  }

  // Handle input field change
  function handleInputChange(index, event) {
    const parsed = parseFloat(event.target.value);
    if (!isNaN(parsed)) {
      const clamped = clamp(parsed, minValue, maxValue);
      updateValue(index, clamped);
    }
  }

  // Handle input blur - reformat the displayed value
  function handleInputBlur(index) {
    inputValues[index] = formatNumber(values[index], 4);
  }

  // Drag state
  let dragging = $state(false);
  let dragIndex = $state(-1);
  let dragStartX = $state(0);
  let dragStartSliderPos = $state(0); // Position in 0-1 slider space

  // Convert value to slider position (0-1)
  function valueToSliderPos(value) {
    if (useLogScale && minValue > 0) {
      return logToLinear(value, minValue, maxValue);
    }
    return value / maxValue;
  }

  // Convert slider position (0-1) to value
  function sliderPosToValue(pos) {
    if (useLogScale && minValue > 0) {
      return linearToLog(pos, minValue, maxValue);
    }
    return pos * maxValue;
  }

  function startDrag(index, event) {
    if (!editable) return;
    const rect = container.getBoundingClientRect();
    dragging = true;
    dragIndex = index;
    dragStartX = event.clientX - rect.left - margin.left;
    dragStartSliderPos = valueToSliderPos(values[index]);
  }

  function onMouseMove(event) {
    if (dragging && dragIndex >= 0) {
      handleRelativeDrag(dragIndex, event);
    }
  }

  function handleRelativeDrag(index, event) {
    const rect = container.getBoundingClientRect();
    const currentX = event.clientX - rect.left - margin.left;
    const deltaX = currentX - dragStartX;
    const deltaRatio = deltaX / chartWidth;

    // Move in slider space (constant sensitivity)
    const newSliderPos = clamp(dragStartSliderPos + deltaRatio, 0, 1);
    const newValue = clamp(sliderPosToValue(newSliderPos), minValue, maxValue);
    updateValue(index, newValue);
  }

  function endDrag() {
    dragging = false;
    dragIndex = -1;
  }

  // Get bar color
  function getBarColor(value, index) {
    if (secondaryValues && secondaryValues.length === 2) {
      // Posterior: use prior and likelihood values for color
      return colorFn(value, secondaryValues[0][index], secondaryValues[1][index]);
    }
    return colorFn(value);
  }

  // Get bar width (accounting for log scale display)
  function getBarWidth(value) {
    return xScale(value);
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

  // Render title with KaTeX if titleTex provided
  let titleEl = $state(null);
  $effect(() => {
    if (titleEl && titleTex) {
      katex.render(titleTex, titleEl, { throwOnError: false, trust: true });
    }
  });
</script>

<svelte:window onpointermove={onMouseMove} onpointerup={endDrag} />

<div class="distribution-chart" bind:this={container}>
  <h3 style="padding-left: {margin.left}px;">
    {title}{#if titleTex}
      {' '}<span class="title-math" bind:this={titleEl}></span>
    {/if}
  </h3>
  <svg
    width={width}
    height={chartHeight + margin.top + margin.bottom}
    class:editable
  >
    <!-- Hidden text element for measuring label widths -->
    <text bind:this={labelMeasureEl} class="label" visibility="hidden" x="-9999" y="-9999"></text>
    <g transform="translate({margin.left}, {margin.top})">
      <!-- Background for drag area -->
      {#if editable}
        <rect
          x="0"
          y="0"
          width={chartWidth}
          height={chartHeight}
          fill="transparent"
          class="drag-area"
        />
      {/if}

      <!-- Bars -->
      {#each values as value, i}
        {@const label = labels[i] || `State ${i + 1}`}
        {@const y = yScale(label)}
        {@const barHeight = yScale.bandwidth()}
        {@const barWidth = getBarWidth(value)}
        {@const color = getBarColor(value, i)}

        <!-- Label -->
        <text
          x="-8"
          y={y + barHeight / 2}
          text-anchor="end"
          dominant-baseline="middle"
          class="label"
        >
          {label}
        </text>

        <!-- Bar background (for dragging) -->
        {#if editable}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <rect
            x="0"
            y={y}
            width={chartWidth}
            height={barHeight}
            class="bar-bg"
            onpointerdown={(e) => startDrag(i, e)}
          />
        {/if}

        <!-- Actual bar -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <rect
          x="0"
          y={y}
          width={Math.max(barWidth, 2)}
          height={barHeight}
          fill={color}
          class="bar"
          class:dragging={dragging && dragIndex === i}
          onpointerdown={(e) => editable && startDrag(i, e)}
        />

        <!-- Drag handle -->
        {#if editable}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <rect
            x={barWidth - 4}
            y={y}
            width="8"
            height={barHeight}
            class="drag-handle"
            onpointerdown={(e) => startDrag(i, e)}
          />
        {/if}

        <!-- Value display -->
        {#if showValues}
          {#if editable}
            <foreignObject
              x={chartWidth + 8}
              y={y + barHeight / 2 - 12}
              width="48"
              height="24"
            >
              <input
                type="text"
                class="value-input"
                bind:value={inputValues[i]}
                onchange={(e) => handleInputChange(i, e)}
                onblur={() => handleInputBlur(i)}
              />
            </foreignObject>
          {:else}
            <text
              x={chartWidth + 12}
              y={y + barHeight / 2}
              dominant-baseline="middle"
              class="value"
            >
              {formatNumber(value, 3)}
            </text>
          {/if}
        {/if}
      {/each}

      <!-- X axis -->
      <line
        x1="0"
        y1={chartHeight}
        x2={chartWidth}
        y2={chartHeight}
        class="axis"
      />
    </g>
  </svg>
</div>

<style>
  .distribution-chart {
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

  .label {
    font-size: 12px;
    fill: var(--text-muted);
  }

  .bar {
    /* no transition - instant updates */
  }

  .bar.dragging {
    /* no visual change on bar — only the handle highlights */
  }

  .bar-bg {
    cursor: ew-resize;
    fill: var(--bar-bg);
  }

  .drag-handle {
    cursor: ew-resize;
    opacity: 0;
    fill: var(--handle-color);
    transition: opacity 0.15s ease;
  }

  .axis {
    stroke: var(--axis-color);
  }

  svg.editable:hover .drag-handle {
    opacity: 1;
  }

  .value {
    font-size: 11px;
    fill: var(--text-muted);
  }

  .value-input {
    width: 100%;
    height: 100%;
    background: var(--input-bg);
    border: 1px solid var(--border-default);
    border-radius: 3px;
    color: var(--text-primary);
    font-size: 10px;
    padding: 2px 4px;
    text-align: right;
  }

  .value-input:focus {
    outline: none;
    border-color: var(--border-strong);
    background: var(--input-bg-hover);
  }

  .drag-area {
    cursor: crosshair;
  }
</style>
