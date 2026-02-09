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

  // Domain
  const domain = [0, 1];

  // Settings
  let logBase = $state(2);
  let numControlPoints = $state(30);
  let surprisalAxisMax = $state(4);
  let configExpanded = $state(false);

  // Grid parameters
  let gridSize = $state(300);

  // Grid x-coordinates (derived from domain)
  let gridX = $derived(
    Array.from({ length: gridSize }, (_, i) =>
      domain[0] + (i / (gridSize - 1)) * (domain[1] - domain[0])
    )
  );
  let dz = $derived((domain[1] - domain[0]) / (gridSize - 1));

  // Preset state
  const DEFAULT_PRIOR_IDX = 3;  // Bimodal
  const DEFAULT_LIK_IDX = 1;   // Bell
  const DEFAULT_LIK_PARAMS = { center: 0.7, width: 0.1 };

  let priorPresetIndex = $state(DEFAULT_PRIOR_IDX);
  let likPresetIndex = $state(DEFAULT_LIK_IDX);
  let priorParams = $state({ ...priorPresets[DEFAULT_PRIOR_IDX].defaultParams });
  let likParams = $state({ ...DEFAULT_LIK_PARAMS });
  let priorFreeEdit = $state(false);
  let likFreeEdit = $state(false);

  // Control point state
  let priorControlYs = $state(
    priorPresets[DEFAULT_PRIOR_IDX].generator(30, priorPresets[DEFAULT_PRIOR_IDX].defaultParams, domain)
  );
  let likControlYs = $state(
    likelihoodPresets[DEFAULT_LIK_IDX].generator(30, DEFAULT_LIK_PARAMS, domain)
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

  // Resample control points to a new count, preserving shape via interpolation
  function resampleControlPoints(oldYs, newN) {
    const oldN = oldYs.length;
    if (oldN === newN) return oldYs;
    if (oldN < 2) return Array(newN).fill(oldYs[0] || 0);
    const oldXs = Array.from({ length: oldN }, (_, i) =>
      domain[0] + (i / (oldN - 1)) * (domain[1] - domain[0])
    );
    const newXs = Array.from({ length: newN }, (_, i) =>
      domain[0] + (i / (newN - 1)) * (domain[1] - domain[0])
    );
    return interpolateMonotone(oldXs, oldYs, newXs).map(v => Math.max(0, v));
  }

  // Apply prior preset (or resample if free-editing)
  function applyPriorPreset() {
    const n = untrack(() => numControlPoints);
    if (untrack(() => priorFreeEdit)) {
      priorControlYs = resampleControlPoints(untrack(() => priorControlYs), n);
    } else {
      const preset = priorPresets[priorPresetIndex];
      priorControlYs = preset.generator(n, priorParams, domain);
    }
  }

  // Apply likelihood preset (or resample if free-editing)
  function applyLikPreset() {
    const n = untrack(() => numControlPoints);
    if (untrack(() => likFreeEdit)) {
      likControlYs = resampleControlPoints(untrack(() => likControlYs), n);
    } else {
      const preset = likelihoodPresets[likPresetIndex];
      likControlYs = preset.generator(n, likParams, domain);
    }
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
    priorPresetIndex = DEFAULT_PRIOR_IDX;
    likPresetIndex = DEFAULT_LIK_IDX;
    priorParams = { ...priorPresets[DEFAULT_PRIOR_IDX].defaultParams };
    likParams = { ...DEFAULT_LIK_PARAMS };
    numControlPoints = 30;
    gridSize = 300;
    logBase = 2;
    priorFreeEdit = false;
    likFreeEdit = false;
    priorControlYs = priorPresets[DEFAULT_PRIOR_IDX].generator(30, priorPresets[DEFAULT_PRIOR_IDX].defaultParams, domain);
    likControlYs = likelihoodPresets[DEFAULT_LIK_IDX].generator(30, DEFAULT_LIK_PARAMS, domain);
  }
</script>

<div class="continuous-app">
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
      titleTex={String.raw`\text{Likelihood } \operatorname{lik}_u(z) \coloneqq p(u \mid z)`}
      bind:controlPointYs={likControlYs}
      gridValues={likGrid}
      {gridX}
      editable={true}
      colorFn={likelihoodColor}
      maxDragY={1}
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

  <div class="config-panel">
    <button
      class="toggle-btn"
      onclick={() => configExpanded = !configExpanded}
      aria-expanded={configExpanded}
    >
      <span class="arrow">{configExpanded ? '▼' : '▶'}</span>
      More options
    </button>

    {#if configExpanded}
      <div class="panel-content">
        <div class="section">
          <h4>Grid Resolution</h4>
          <p class="description">
            Number of points for numerical integration (trapezoidal rule). Higher values are more accurate but slower.
          </p>
          <div class="slider-input">
            <label>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                bind:value={gridSize}
              />
            </label>
            <span class="value">{gridSize}</span>
          </div>
        </div>

        <div class="section">
          <h4>Surprisal Axis Maximum</h4>
          <p class="description">
            Default maximum for the surprisal bar axis. The axis auto-scales when surprisal exceeds this value.
          </p>
          <div class="slider-input">
            <label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                bind:value={surprisalAxisMax}
              />
            </label>
            <span class="value">{surprisalAxisMax}</span>
          </div>
        </div>

        <div class="section reset-section">
          <button class="reset-all-btn" onclick={resetAll}>
            Reset All to Defaults
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .continuous-app {
    max-width: 1400px;
    margin: 0 auto;
  }

  .info-card {
    background: var(--bg-surface);
    border-radius: 8px;
    padding: 1.5rem;
    margin-top: 1.5rem;
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

  .config-panel {
    margin-top: 1rem;
  }

  .toggle-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 0.85rem;
    cursor: pointer;
    padding: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .toggle-btn:hover {
    color: var(--text-primary);
  }

  .arrow {
    font-size: 0.7rem;
    transition: transform 0.15s ease;
  }

  .panel-content {
    background: var(--bg-surface);
    border-radius: 8px;
    padding: 1rem;
    margin-top: 0.5rem;
  }

  .section {
    margin-bottom: 1.5rem;
  }

  .section:last-child {
    margin-bottom: 0;
  }

  .section h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .description {
    font-size: 0.8rem;
    color: var(--text-faint);
    margin: 0 0 0.5rem 0;
  }

  .slider-input {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .slider-input label {
    flex: 1;
    max-width: 200px;
  }

  .slider-input input[type="range"] {
    width: 100%;
    cursor: pointer;
  }

  .slider-input .value {
    font-size: 0.85rem;
    font-family: monospace;
    color: var(--text-primary);
    min-width: 3rem;
  }

  .reset-section {
    padding-top: 0.5rem;
    border-top: 1px solid var(--border-subtle);
  }

  .reset-all-btn {
    background: var(--reset-bg);
    border: 1px solid var(--reset-border);
    border-radius: 4px;
    color: var(--reset-text);
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .reset-all-btn:hover {
    background: var(--reset-bg-hover);
    border-color: var(--reset-border-hover);
  }

  @media (max-width: 768px) {
    .charts-container {
      flex-direction: column;
    }
  }
</style>
