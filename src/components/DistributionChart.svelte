<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { clamp, formatNumber } from '../lib/math.js';

  // Props
  let {
    title = '',
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

  // Dimensions
  const margin = { top: 30, right: 60, bottom: 20, left: 80 };

  // Compute chart dimensions
  let chartWidth = $derived(width - margin.left - margin.right);
  let chartHeight = $derived(Math.max(values.length * 40, 100));

  // Scales
  let xScale = $derived(
    d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, chartWidth])
  );

  let yScale = $derived(
    d3.scaleBand()
      .domain(labels.length ? labels : values.map((_, i) => `State ${i + 1}`))
      .range([0, chartHeight])
      .padding(0.2)
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

  function startDrag(index, event) {
    if (!editable) return;
    dragging = true;
    dragIndex = index;
    handleDrag(index, event);
  }

  function onMouseMove(event) {
    if (dragging && dragIndex >= 0) {
      handleDrag(dragIndex, event);
    }
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
</script>

<svelte:window onmousemove={onMouseMove} onmouseup={endDrag} />

<div class="distribution-chart" bind:this={container}>
  <h3>{title}</h3>
  <svg
    width={width}
    height={chartHeight + margin.top + margin.bottom}
    class:editable
  >
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
            fill="rgba(255,255,255,0.05)"
            class="bar-bg"
            onmousedown={(e) => startDrag(i, e)}
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
          onmousedown={(e) => editable && startDrag(i, e)}
        />

        <!-- Drag handle -->
        {#if editable}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <rect
            x={barWidth - 4}
            y={y}
            width="8"
            height={barHeight}
            fill="rgba(255,255,255,0.3)"
            class="drag-handle"
            onmousedown={(e) => startDrag(i, e)}
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
        stroke="rgba(255,255,255,0.2)"
      />
    </g>
  </svg>
</div>

<style>
  .distribution-chart {
    flex: 1;
    min-width: 250px;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
  }

  svg {
    display: block;
  }

  svg.editable {
    cursor: crosshair;
  }

  .label {
    font-size: 12px;
    fill: rgba(255, 255, 255, 0.8);
  }

  .bar {
    transition: fill 0.15s ease;
  }

  .bar.dragging {
    filter: brightness(1.2);
  }

  .bar-bg {
    cursor: ew-resize;
  }

  .drag-handle {
    cursor: ew-resize;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  svg.editable:hover .drag-handle {
    opacity: 1;
  }

  .value {
    font-size: 11px;
    fill: rgba(255, 255, 255, 0.7);
  }

  .value-input {
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 10px;
    padding: 2px 4px;
    text-align: right;
  }

  .value-input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.15);
  }

  .drag-area {
    cursor: crosshair;
  }
</style>
