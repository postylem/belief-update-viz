<script>
  import { formatNumber } from '../lib/math.js';
  import { KL_COLOR, R_COLOR } from '../lib/colors.js';

  let {
    surprisal = 0,
    kl = 0,
    r = 0,
    unit = 'bits',
  } = $props();

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
</script>

<div class="surprisal-bar">
  <div class="header">
    <span class="title">Surprisal Decomposition</span>
    <span class="equation">
      surprisal(u) = KL + R
    </span>
  </div>

  {#if isValid}
    <div class="bar-container">
      <div
        class="bar-segment kl"
        style="width: {klPercent}%; background-color: {KL_COLOR};"
      >
        {#if klPercent > 15}
          <span class="segment-label">KL</span>
        {/if}
      </div>
      <div
        class="bar-segment r"
        style="width: {rPercent}%; background-color: {R_COLOR};"
      >
        {#if rPercent > 15}
          <span class="segment-label">R</span>
        {/if}
      </div>
    </div>

    <div class="values">
      <div class="value-item">
        <span class="value-label">Surprisal:</span>
        <span class="value-number">{surprisalStr} {unit}</span>
      </div>
      <div class="value-item">
        <span class="value-dot" style="background-color: {KL_COLOR};"></span>
        <span class="value-label">KL(post‖prior):</span>
        <span class="value-number">{klStr} {unit}</span>
      </div>
      <div class="value-item">
        <span class="value-dot" style="background-color: {R_COLOR};"></span>
        <span class="value-label">R(u):</span>
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
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    font-family: 'Times New Roman', serif;
    font-style: italic;
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
    transition: width 0.3s ease;
    min-width: 2px;
  }

  .segment-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
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
