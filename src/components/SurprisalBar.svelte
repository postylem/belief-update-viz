<script>
  import katex from 'katex';
  import { formatNumber } from '../lib/math.js';
  import { KL_COLOR, R_COLOR } from '../lib/colors.js';

  let {
    surprisal = 0,
    kl = 0,
    r = 0,
    unit = 'bits',
    axisMax = $bindable(6),
  } = $props();

  let equationEl;

  // Tooltip state
  let tooltipVisible = $state(false);
  let tooltipContent = $state(null);
  let tooltipX = $state(0);
  let tooltipY = $state(0);
  let tooltipEl = $state(null);

  // Effective axis maximum: at least the surprisal value
  let effectiveMax = $derived(Math.max(axisMax, surprisal));

  // Compute bar width as percentage of axis
  let barWidthPercent = $derived(
    effectiveMax > 0 && Number.isFinite(surprisal)
      ? (surprisal / effectiveMax) * 100
      : 0
  );

  // Compute KL and R widths relative to the bar (not the full axis)
  let klWidthPercent = $derived(
    surprisal > 0 && Number.isFinite(surprisal)
      ? (kl / effectiveMax) * 100
      : 0
  );
  let rWidthPercent = $derived(
    surprisal > 0 && Number.isFinite(surprisal)
      ? (r / effectiveMax) * 100
      : 0
  );

  // Calculate a "nice" step size for axis ticks
  function niceStep(range, targetTicks = 6) {
    const roughStep = range / targetTicks;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const residual = roughStep / magnitude;

    // Round to 1, 2, 5, or 10
    let niceResidual;
    if (residual <= 1.5) niceResidual = 1;
    else if (residual <= 3) niceResidual = 2;
    else if (residual <= 7) niceResidual = 5;
    else niceResidual = 10;

    return niceResidual * magnitude;
  }

  // Generate tick marks at nice intervals
  let ticks = $derived(() => {
    const step = niceStep(effectiveMax);
    const tickValues = [];

    // Start at 0, go up by step until we exceed effectiveMax
    for (let v = 0; v <= effectiveMax + step * 0.001; v += step) {
      tickValues.push({
        value: v,
        percent: (v / effectiveMax) * 100
      });
    }

    return tickValues;
  });

  // Format for display
  let surprisalStr = $derived(formatNumber(surprisal, 4));
  let klStr = $derived(formatNumber(kl, 4));
  let rStr = $derived(formatNumber(r, 4));

  // Check for undefined/infinite values
  let isValid = $derived(
    Number.isFinite(surprisal) &&
    Number.isFinite(kl) &&
    Number.isFinite(r)
  );

  // Render equation with KaTeX
  $effect(() => {
    if (equationEl) {
      katex.render(
        String.raw`\mathrm{surprisal}(u) = {\color{#45a085}D_{\mathrm{KL}}} + {\color{#e87040}R}`,
        equationEl,
        { throwOnError: false, trust: true }
      );
    }
  });

  // Render tooltip content with KaTeX
  $effect(() => {
    if (tooltipEl && tooltipContent) {
      katex.render(tooltipContent, tooltipEl, { throwOnError: false, trust: true });
    }
  });

  // Helper to render inline KaTeX
  function tex(str) {
    return katex.renderToString(str, { throwOnError: false, trust: true });
  }

  // Format tick value
  function formatTick(val) {
    if (val === 0) return '0';
    if (val >= 10) return val.toFixed(0);
    if (val >= 1) return val.toFixed(1);
    return val.toFixed(2);
  }

  // Tooltip handlers
  function showTooltip(type, event) {
    const rect = event.currentTarget.getBoundingClientRect();
    tooltipX = rect.left + rect.width / 2;
    tooltipY = rect.top - 8;

    if (type === 'kl') {
      tooltipContent = String.raw`{\color{#45a085}D_{\mathrm{KL}}} = ${klStr} \text{ ${unit}}`;
    } else {
      tooltipContent = String.raw`{\color{#e87040}R} = ${rStr} \text{ ${unit}}`;
    }
    tooltipVisible = true;
  }

  function hideTooltip() {
    tooltipVisible = false;
  }
</script>

<div class="surprisal-bar">
  <div class="header">
    <span class="title">Surprisal Decomposition</span>
    <span class="equation" bind:this={equationEl}></span>
  </div>

  {#if isValid}
    <div class="bar-wrapper">
      <div class="bar-container">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="bar-segment kl"
          style="width: {klWidthPercent}%; background-color: {KL_COLOR};"
          onmouseenter={(e) => showTooltip('kl', e)}
          onmouseleave={hideTooltip}
        >
          {#if klWidthPercent > 12}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            <span class="segment-label">{@html tex(String.raw`D_{\mathrm{KL}}`)}</span>
          {/if}
        </div>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="bar-segment r"
          style="width: {rWidthPercent}%; background-color: {R_COLOR};"
          onmouseenter={(e) => showTooltip('r', e)}
          onmouseleave={hideTooltip}
        >
          {#if rWidthPercent > 8}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            <span class="segment-label">{@html tex('R')}</span>
          {/if}
        </div>
      </div>
      <div class="axis">
        {#each ticks() as tick}
          <div class="tick" style="left: {tick.percent}%;">
            <div class="tick-mark"></div>
            <span class="tick-label">{formatTick(tick.value)}</span>
          </div>
        {/each}
      </div>
      <div class="axis-label">{unit}</div>
    </div>

    <div class="values">
      <div class="value-item">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <span class="value-label">{@html tex(String.raw`\mathrm{surprisal}(u)`)}: </span>
        <span class="value-number">{surprisalStr} {unit}</span>
      </div>
      <div class="value-item">
        <span class="value-dot" style="background-color: {KL_COLOR};"></span>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <span class="value-label">{@html tex(String.raw`{\color{#45a085}D_{\mathrm{KL}}(p_{Z|u} \| p_Z)}`)}: </span>
        <span class="value-number">{klStr} {unit}</span>
      </div>
      <div class="value-item">
        <span class="value-dot" style="background-color: {R_COLOR};"></span>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <span class="value-label">{@html tex(String.raw`{\color{#e87040}R(u)}`)}: </span>
        <span class="value-number">{rStr} {unit}</span>
      </div>
    </div>
  {:else}
    <div class="undefined-message">
      {#if !Number.isFinite(surprisal)}
        Surprisal undefined (marginal likelihood = 0)
      {:else if !Number.isFinite(kl)}
        KL divergence undefined
      {:else}
        R undefined
      {/if}
    </div>
  {/if}
</div>

{#if tooltipVisible}
  <div
    class="tooltip"
    style="left: {tooltipX}px; top: {tooltipY}px;"
    bind:this={tooltipEl}
  ></div>
{/if}

<style>
  .surprisal-bar {
    background: var(--bg-surface);
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1.5rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.75rem;
  }

  .title {
    font-weight: 500;
    font-size: 0.9rem;
  }

  .equation {
    font-size: 0.85rem;
    color: var(--text-faint);
  }

  .equation :global(.katex) {
    color: var(--text-muted);
  }

  .bar-wrapper {
    position: relative;
    margin-bottom: 1rem;
  }

  .bar-container {
    display: flex;
    height: 32px;
    border-radius: 4px;
    overflow: hidden;
    background: var(--bar-bg);
  }

  .bar-segment {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    cursor: default;
  }

  .segment-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    pointer-events: none;
  }

  .segment-label :global(.katex) {
    color: white;
  }

  .axis {
    position: relative;
    height: 20px;
    margin-top: 4px;
  }

  .tick {
    position: absolute;
    transform: translateX(-50%);
  }

  .tick-mark {
    width: 1px;
    height: 6px;
    background: var(--text-faintest);
    margin: 0 auto;
  }

  .tick-label {
    font-size: 0.65rem;
    color: var(--text-faint);
    font-family: 'SF Mono', 'Monaco', monospace;
  }

  .axis-label {
    position: absolute;
    right: 0;
    top: 36px;
    font-size: 0.7rem;
    color: var(--text-faint);
  }

  .values {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .value-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
  }

  .value-dot {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }

  .value-label {
    color: var(--text-muted);
  }

  .value-number {
    font-family: 'SF Mono', 'Monaco', monospace;
    color: var(--text-primary);
  }

  .undefined-message {
    color: var(--warning-text);
    font-style: italic;
    padding: 0.5rem 0;
  }

  .tooltip {
    position: fixed;
    transform: translate(-50%, -100%);
    background: var(--bg-primary);
    border: 1px solid var(--border-default);
    border-radius: 6px;
    padding: 0.4rem 0.7rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    pointer-events: none;
    white-space: nowrap;
  }

  .tooltip :global(.katex) {
    font-size: 0.95rem;
  }
</style>
