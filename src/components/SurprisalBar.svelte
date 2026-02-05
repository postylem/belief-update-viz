<script>
  import katex from 'katex';
  import { formatNumber } from '../lib/math.js';
  import { KL_COLOR, R_COLOR } from '../lib/colors.js';

  let {
    surprisal = 0,
    kl = 0,
    r = 0,
    unit = 'bits',
  } = $props();

  let equationEl;

  // Compute widths as percentages
  let klPercent = $derived(
    surprisal > 0 && Number.isFinite(surprisal)
      ? (kl / surprisal) * 100
      : 50
  );
  let rPercent = $derived(100 - klPercent);

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
        String.raw`\mathrm{surprisal}(u) = {\color{#9966cc}D_{\mathrm{KL}}} + {\color{#33aaaa}R}`,
        equationEl,
        { throwOnError: false, trust: true }
      );
    }
  });

  // Helper to render inline KaTeX
  function tex(str) {
    return katex.renderToString(str, { throwOnError: false, trust: true });
  }
</script>

<div class="surprisal-bar">
  <div class="header">
    <span class="title">Surprisal Decomposition</span>
    <span class="equation" bind:this={equationEl}></span>
  </div>

  {#if isValid}
    <div class="bar-container">
      <div
        class="bar-segment kl"
        style="width: {klPercent}%; background-color: {KL_COLOR};"
      >
        {#if klPercent > 15}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <span class="segment-label">{@html tex(String.raw`D_{\mathrm{KL}}`)}</span>
        {/if}
      </div>
      <div
        class="bar-segment r"
        style="width: {rPercent}%; background-color: {R_COLOR};"
      >
        {#if rPercent > 15}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <span class="segment-label">{@html tex('R')}</span>
        {/if}
      </div>
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
        <span class="value-label">{@html tex(String.raw`{\color{#9966cc}D_{\mathrm{KL}}(p_{Z|u} \| p_Z)}`)}: </span>
        <span class="value-number">{klStr} {unit}</span>
      </div>
      <div class="value-item">
        <span class="value-dot" style="background-color: {R_COLOR};"></span>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <span class="value-label">{@html tex(String.raw`{\color{#33aaaa}R(u)}`)}: </span>
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

<style>
  .surprisal-bar {
    background: rgba(255, 255, 255, 0.05);
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
    color: rgba(255, 255, 255, 0.6);
  }

  .equation :global(.katex) {
    color: rgba(255, 255, 255, 0.7);
  }

  .bar-container {
    display: flex;
    height: 32px;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.75rem;
  }

  .bar-segment {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2px;
  }

  .segment-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .segment-label :global(.katex) {
    color: white;
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
    color: rgba(255, 255, 255, 0.7);
  }

  .value-number {
    font-family: 'SF Mono', 'Monaco', monospace;
    color: rgba(255, 255, 255, 0.95);
  }

  .undefined-message {
    color: rgba(255, 200, 100, 0.9);
    font-style: italic;
    padding: 0.5rem 0;
  }
</style>
