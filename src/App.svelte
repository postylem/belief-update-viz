<script>
  import { untrack } from 'svelte';
  import katex from 'katex';
  import { computeAll, normalize } from './lib/math.js';
  import { uniform, uniformLikelihood } from './lib/presets.js';
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

<main>
  <h1>Bayesian Belief Update</h1>

  <Controls
    bind:supportSize
    bind:logBase
    bind:allowZeroes
    bind:useLogSliders
    onApplyPriorPreset={applyPriorPreset}
    onApplyLikelihoodPreset={applyLikelihoodPreset}
    onReset={reset}
  />

  <div class="charts-container">
    {#if priorUndefined}
      <div class="chart-placeholder">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <h3>{@html tex(String.raw`\text{Prior } p(Z)`)}</h3>
        <div class="undefined-message">Prior undefined (all values are zero)</div>
      </div>
    {:else}
      <DistributionChart
        title="Prior"
        titleTex={String.raw`\text{Prior } p(Z)`}
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
      titleTex={String.raw`\text{Likelihood } p(u \mid Z)`}
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
        <h3>{@html tex(String.raw`\text{Posterior } p(Z \mid u)`)}</h3>
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
        titleTex={String.raw`\text{Posterior } p(Z \mid u)`}
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

  <SurprisalBar
    {surprisal}
    {kl}
    {r}
    {unit}
  />

  <EquationDisplay
    {kl}
    {r}
    {surprisal}
    {unit}
  />

  <ConfigPanel
    bind:labels
    bind:epsilon
    bind:expanded={configExpanded}
  />
</main>

<style>
  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1.5rem 2rem;
  }

  h1 {
    margin: 0 0 1.5rem 0;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
  }

  .charts-container {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .chart-placeholder {
    flex: 1;
    min-width: 250px;
  }

  .chart-placeholder h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
  }

  .undefined-message {
    background: rgba(255, 200, 100, 0.1);
    border: 1px solid rgba(255, 200, 100, 0.3);
    border-radius: 8px;
    padding: 2rem;
    color: rgba(255, 200, 100, 0.9);
    font-style: italic;
    text-align: center;
  }
</style>
