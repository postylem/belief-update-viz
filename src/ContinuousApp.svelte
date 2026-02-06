<script>
  import { untrack } from 'svelte';
  import { computeAllContinuous, normalizeDensity } from './lib/math.js';
  import { interpolateMonotone } from './lib/interpolation.js';
  import { priorPresets, likelihoodPresets } from './lib/continuousPresets.js';
  import { priorColor, likelihoodColor, posteriorColor } from './lib/colors.js';

  import CurveChart from './components/CurveChart.svelte';
  import ContinuousControls from './components/ContinuousControls.svelte';
  import SurprisalBar from './components/SurprisalBar.svelte';
  import EquationDisplay from './components/EquationDisplay.svelte';

  // Theme state
  let lightTheme = $state(
    typeof localStorage !== 'undefined' && localStorage.getItem('theme') === 'light'
  );

  $effect(() => {
    if (lightTheme) {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  });

  // Domain
  const domain = [0, 1];

  // Settings
  let logBase = $state(2);
  let numControlPoints = $state(15);
  let surprisalAxisMax = $state(4);

  // Grid parameters
  const GRID_SIZE = 300;

  // Grid x-coordinates (derived from domain)
  let gridX = $derived(
    Array.from({ length: GRID_SIZE }, (_, i) =>
      domain[0] + (i / (GRID_SIZE - 1)) * (domain[1] - domain[0])
    )
  );
  let dz = $derived((domain[1] - domain[0]) / (GRID_SIZE - 1));

  // Preset state
  let priorPresetIndex = $state(1); // Gaussian
  let likPresetIndex = $state(1);   // Gaussian
  let priorParams = $state({ ...priorPresets[1].defaultParams });
  let likParams = $state({ ...likelihoodPresets[1].defaultParams });
  let priorFreeEdit = $state(false);
  let likFreeEdit = $state(false);

  // Control point state
  let priorControlYs = $state(
    priorPresets[1].generator(15, priorPresets[1].defaultParams, domain)
  );
  let likControlYs = $state(
    likelihoodPresets[1].generator(15, likelihoodPresets[1].defaultParams, domain)
  );

  // Control point x-coordinates
  let controlXs = $derived(
    Array.from({ length: numControlPoints }, (_, i) =>
      domain[0] + (i / (numControlPoints - 1)) * (domain[1] - domain[0])
    )
  );

  // Interpolate control points to grid
  let priorGrid = $derived(
    interpolateMonotone(controlXs, priorControlYs, gridX).map(v => Math.max(0, v))
  );
  let likGrid = $derived(
    interpolateMonotone(controlXs, likControlYs, gridX).map(v => Math.max(0, v))
  );

  // Normalize prior density so it integrates to 1
  let priorNormalized = $derived(normalizeDensity(priorGrid, dz) || priorGrid);

  // Compute all Bayesian quantities
  let computed = $derived(computeAllContinuous(priorNormalized, likGrid, logBase, dz));
  let posterior = $derived(computed.posterior);
  let kl = $derived(computed.kl);
  let surprisal = $derived(computed.surprisal);
  let r = $derived(computed.r);

  let unit = $derived(logBase === 2 ? 'bits' : 'nats');
  let posteriorUndefined = $derived(posterior === null);

  // Y-axis max for prior and posterior (shared for comparison)
  let priorYMax = $state(null);
  let posteriorYMax = $state(null);

  // Apply prior preset
  function applyPriorPreset() {
    const preset = priorPresets[priorPresetIndex];
    const n = untrack(() => numControlPoints);
    priorControlYs = preset.generator(n, priorParams, domain);
  }

  // Apply likelihood preset
  function applyLikPreset() {
    const preset = likelihoodPresets[likPresetIndex];
    const n = untrack(() => numControlPoints);
    likControlYs = preset.generator(n, likParams, domain);
  }

  // Handle free-edit: when user drags control points
  function onPriorEdit() {
    priorFreeEdit = true;
  }

  function onLikEdit() {
    likFreeEdit = true;
  }

  // Reset all
  function resetAll() {
    priorPresetIndex = 1;
    likPresetIndex = 1;
    priorParams = { ...priorPresets[1].defaultParams };
    likParams = { ...likelihoodPresets[1].defaultParams };
    numControlPoints = 15;
    logBase = 2;
    priorFreeEdit = false;
    likFreeEdit = false;
    priorControlYs = priorPresets[1].generator(15, priorPresets[1].defaultParams, domain);
    likControlYs = likelihoodPresets[1].generator(15, likelihoodPresets[1].defaultParams, domain);
  }
</script>

<main>
  <header>
    <h1>Continuous Bayesian Belief Update</h1>
    <div class="header-actions">
      <a href="/" class="nav-link">Discrete version</a>
      <button
        class="theme-toggle"
        onclick={() => lightTheme = !lightTheme}
        title={lightTheme ? 'Switch to dark theme' : 'Switch to light theme'}
      >
        {lightTheme ? '⏾' : '☀︎'}
      </button>
    </div>
  </header>

  <ContinuousControls
    bind:priorPresetIndex
    bind:likPresetIndex
    bind:priorParams
    bind:likParams
    bind:priorFreeEdit
    bind:likFreeEdit
    bind:numControlPoints
    bind:logBase
    onApplyPriorPreset={applyPriorPreset}
    onApplyLikPreset={applyLikPreset}
    onReset={resetAll}
  />

  <div class="charts-container">
    <CurveChart
      title="Prior"
      titleTex={String.raw`\text{Prior density } f_Z(z)`}
      bind:controlPointYs={priorControlYs}
      gridValues={priorNormalized}
      {gridX}
      editable={true}
      colorFn={priorColor}
      {domain}
      bind:yMax={priorYMax}
      onchange={onPriorEdit}
    />

    <CurveChart
      title="Likelihood"
      titleTex={String.raw`\text{Likelihood } p(u \mid z)`}
      bind:controlPointYs={likControlYs}
      gridValues={likGrid}
      {gridX}
      editable={true}
      colorFn={likelihoodColor}
      {domain}
      onchange={onLikEdit}
    />

    {#if posteriorUndefined}
      <div class="chart-placeholder">
        <h3>Posterior density f(z|u)</h3>
        <div class="undefined-message">
          Posterior undefined (marginal likelihood = 0)
        </div>
      </div>
    {:else}
      <CurveChart
        title="Posterior"
        titleTex={String.raw`\text{Posterior density } f_{Z|u}(z)`}
        controlPointYs={[]}
        gridValues={posterior}
        {gridX}
        editable={false}
        colorFn={(v) => posteriorColor(v, 0.5, 0.5)}
        {domain}
        bind:yMax={posteriorYMax}
      />
    {/if}
  </div>

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
</main>

<style>
  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1.5rem 2rem;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  h1 {
    margin: 0;
    font-weight: 600;
    color: var(--text-primary);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .nav-link {
    font-size: 0.85rem;
    color: var(--text-muted);
    text-decoration: none;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
  }

  .nav-link:hover {
    color: var(--text-primary);
    background: var(--bg-surface-hover);
  }

  .theme-toggle {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    font-size: 1.25rem;
    cursor: pointer;
  }

  .theme-toggle:hover {
    background: var(--bg-surface-hover);
    border-color: var(--border-strong);
  }

  .charts-container {
    display: flex;
    gap: 1rem;
  }

  .chart-placeholder {
    flex: 1;
    min-width: 0;
  }

  .chart-placeholder h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-primary);
    padding-left: 50px;
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

  @media (max-width: 768px) {
    main {
      padding: 1rem;
    }

    .charts-container {
      flex-direction: column;
    }
  }
</style>
