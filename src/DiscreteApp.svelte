<script>
  import { untrack } from 'svelte';
  import katex from 'katex';
  import { computeAll, normalize } from './lib/math.js';
  import { uniform } from './lib/presets.js';
  import { priorColor, likelihoodColor, posteriorColor } from './lib/colors.js';

  import DistributionChart from './components/DistributionChart.svelte';
  import SurprisalBar from './components/SurprisalBar.svelte';
  import EquationDisplay from './components/EquationDisplay.svelte';
  import Controls from './components/Controls.svelte';
  import ConfigPanel from './components/ConfigPanel.svelte';

  // Helper to render inline KaTeX
  function tex(str) {
    return katex.renderToString(str, { throwOnError: false, trust: true });
  }

  // Core state
  let supportSize = $state(4);
  let labels = $state(generateLabels(4));
  let prior = $state(uniform(4));
  let likelihood = $state([0.9, 0.3, 0.2, 0.5]);

  // Settings
  let logBase = $state(2);
  let allowZeroes = $state(false);
  let useLogSliders = $state(false);
  let epsilon = $state(1e-6);
  let surprisalAxisMax = $state(4);
  let configExpanded = $state(false);

  // Derived: minimum value for sliders
  let minValue = $derived(allowZeroes ? 0 : epsilon);

  // Derived: computed Bayesian quantities
  let computed = $derived(computeAll(prior, likelihood, logBase));
  let posterior = $derived(computed.posterior);
  let kl = $derived(computed.kl);
  let surprisal = $derived(computed.surprisal);
  let r = $derived(computed.r);

  // Unit string
  let unit = $derived(logBase === 2 ? 'bits' : 'nats');

  // Check for undefined states
  let priorUndefined = $derived(prior.every(v => v === 0));
  let posteriorUndefined = $derived(posterior === null);

  // Generate default labels
  function generateLabels(n) {
    return Array(n).fill(0).map((_, i) => `z${i + 1}`);
  }

  // Handle support size change
  $effect(() => {
    const n = supportSize;
    // Use untrack to read arrays without subscribing (only supportSize triggers this)
    const currentPrior = untrack(() => prior);
    const currentLikelihood = untrack(() => likelihood);
    const currentLabels = untrack(() => labels);
    const currentN = currentPrior.length;

    if (n !== currentN) {
      if (n > currentN) {
        // Add new states
        const newPrior = [...currentPrior];
        const newLikelihood = [...currentLikelihood];
        const newLabels = [...currentLabels];
        for (let i = currentN; i < n; i++) {
          newPrior.push(1 / n);
          newLikelihood.push(0.5);
          newLabels.push(`z${i + 1}`);
        }
        prior = normalize(newPrior) || uniform(n);
        likelihood = newLikelihood;
        labels = newLabels;
      } else {
        // Remove states
        prior = normalize(currentPrior.slice(0, n)) || uniform(n);
        likelihood = currentLikelihood.slice(0, n);
        labels = currentLabels.slice(0, n);
      }
    }
  });

  // Apply prior preset
  function applyPriorPreset(generator) {
    const newPrior = generator(supportSize);
    // Ensure no zeros if allowZeroes is off
    if (!allowZeroes) {
      prior = newPrior.map(v => Math.max(v, epsilon));
      prior = normalize(prior);
    } else {
      prior = newPrior;
    }
  }

  // Apply likelihood preset
  function applyLikelihoodPreset(generator) {
    const newLikelihood = generator(supportSize);
    // Ensure no zeros if allowZeroes is off
    if (!allowZeroes) {
      likelihood = newLikelihood.map(v => Math.max(v, epsilon));
    } else {
      likelihood = newLikelihood;
    }
  }

  // Reset to defaults
  function reset() {
    prior = uniform(supportSize);
    likelihood = Array(supportSize).fill(0).map((_, i) =>
      i === 0 ? 0.9 : 0.3 + Math.random() * 0.4
    );
    labels = generateLabels(supportSize);
  }

  // Reset all settings to defaults
  function resetAll() {
    supportSize = 4;
    logBase = 2;
    allowZeroes = false;
    useLogSliders = false;
    epsilon = 1e-6;
    surprisalAxisMax = 4;
    prior = uniform(4);
    likelihood = [0.9, 0.3, 0.2, 0.5];
    labels = generateLabels(4);
  }

  // Enforce min values when allowZeroes changes
  $effect(() => {
    if (!allowZeroes) {
      // Use untrack to read values without subscribing (prevents infinite loop)
      const currentPrior = untrack(() => prior);
      const currentLikelihood = untrack(() => likelihood);
      const eps = untrack(() => epsilon);

      prior = normalize(currentPrior.map(v => Math.max(v, eps)));
      likelihood = currentLikelihood.map(v => Math.max(v, eps));
    }
  });
</script>

<div class="discrete-app">
  <Controls
    bind:supportSize
    bind:logBase
    bind:allowZeroes
    bind:useLogSliders
    bind:likelihood
    {minValue}
    onApplyPriorPreset={applyPriorPreset}
    onApplyLikelihoodPreset={applyLikelihoodPreset}
    onReset={reset}
  />

  <div class="charts-container">
    {#if priorUndefined}
      <div class="chart-placeholder">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <h3>Prior {@html tex(String.raw`p(Z)`)}</h3>
        <div class="undefined-message">Prior undefined (all values are zero)</div>
      </div>
    {:else}
      <DistributionChart
        title="Prior"
        titleTex={String.raw`p(Z)`}
        bind:values={prior}
        {labels}
        editable={true}
        colorFn={priorColor}
        minValue={minValue}
        maxValue={1}
        useLogScale={useLogSliders}
        isPrior={true}
      />
    {/if}

    <DistributionChart
      title="Likelihood"
      titleTex={String.raw`\operatorname{lik}_u(z) \coloneqq p(u \mid z)`}
      bind:values={likelihood}
      {labels}
      editable={true}
      colorFn={likelihoodColor}
      minValue={minValue}
      maxValue={1}
      useLogScale={useLogSliders}
      isPrior={false}
    />

    {#if posteriorUndefined}
      <div class="chart-placeholder">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <h3>Posterior {@html tex(String.raw`p(Z \mid u)`)}</h3>
        <div class="undefined-message">
          Posterior undefined
          {#if priorUndefined}
            (prior is undefined)
          {:else}
            (marginal likelihood = 0)
          {/if}
        </div>
      </div>
    {:else}
      <DistributionChart
        title="Posterior"
        titleTex={String.raw`p(Z \mid u)`}
        values={posterior}
        {labels}
        editable={false}
        colorFn={posteriorColor}
        minValue={0}
        maxValue={1}
        secondaryValues={[prior, likelihood]}
      />
    {/if}
  </div>

  <div class="info-card">
    <SurprisalBar
      {surprisal}
      {kl}
      {r}
      {unit}
      axisMax={surprisalAxisMax}
    />

    <EquationDisplay
      {kl}
      {r}
      {surprisal}
      {unit}
    />
  </div>

  <ConfigPanel
    bind:labels
    bind:epsilon
    bind:surprisalAxisMax
    bind:expanded={configExpanded}
    onResetAll={resetAll}
  />
</div>

<style>
  .discrete-app {
    max-width: 1400px;
    margin: 0 auto;
  }

  .charts-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto 1fr;
    gap: 0 1rem;
  }

  .charts-container > :global(*) {
    display: grid;
    grid-row: span 2;
    grid-template-rows: subgrid;
    min-width: 0;
  }

  .chart-placeholder {
    min-width: 0;
  }

  .info-card {
    background: var(--bg-surface);
    border-radius: 8px;
    padding: 1.5rem;
    margin-top: 1.5rem;
  }

  @media (max-width: 768px) {
    .charts-container {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .charts-container > :global(*) {
      grid-row: auto;
      display: block;
    }
  }

  .chart-placeholder h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .undefined-message {
    background: var(--warning-bg);
    border: 1px solid var(--warning-border);
    border-radius: 8px;
    padding: 2rem;
    color: var(--warning-text);
    font-style: italic;
    text-align: center;
  }
</style>
