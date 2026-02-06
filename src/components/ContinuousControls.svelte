<script>
  import { priorPresets, likelihoodPresets } from '../lib/continuousPresets.js';

  let {
    priorPresetIndex = $bindable(0),
    likPresetIndex = $bindable(0),
    priorParams = $bindable({}),
    likParams = $bindable({}),
    priorFreeEdit = $bindable(false),
    likFreeEdit = $bindable(false),
    numControlPoints = $bindable(15),
    logBase = $bindable(2),
    onApplyPriorPreset = () => {},
    onApplyLikPreset = () => {},
    onReset = () => {},
  } = $props();

  let unit = $derived(logBase === 2 ? 'bits' : 'nats');

  function handlePriorPresetChange(event) {
    const idx = parseInt(event.target.value);
    priorPresetIndex = idx;
    const preset = priorPresets[idx];
    priorParams = { ...preset.defaultParams };
    priorFreeEdit = false;
    onApplyPriorPreset();
  }

  function handleLikPresetChange(event) {
    const idx = parseInt(event.target.value);
    likPresetIndex = idx;
    const preset = likelihoodPresets[idx];
    likParams = { ...preset.defaultParams };
    likFreeEdit = false;
    onApplyLikPreset();
  }

  function handlePriorParamChange(name, event) {
    priorParams = { ...priorParams, [name]: parseFloat(event.target.value) };
    priorFreeEdit = false;
    onApplyPriorPreset();
  }

  function handleLikParamChange(name, event) {
    likParams = { ...likParams, [name]: parseFloat(event.target.value) };
    likFreeEdit = false;
    onApplyLikPreset();
  }

  function resetPriorToParametric() {
    priorFreeEdit = false;
    onApplyPriorPreset();
  }

  function resetLikToParametric() {
    likFreeEdit = false;
    onApplyLikPreset();
  }

  function handleControlPointsChange(event) {
    numControlPoints = parseInt(event.target.value);
    // Re-apply both presets with new control point count
    if (!priorFreeEdit) onApplyPriorPreset();
    if (!likFreeEdit) onApplyLikPreset();
  }
</script>

<div class="controls">
  <div class="controls-row">
    <!-- Prior controls -->
    <div class="control-group">
      <span class="group-label">Prior</span>
      <select value={priorPresetIndex} onchange={handlePriorPresetChange} aria-label="Prior preset">
        {#each priorPresets as preset, i}
          <option value={i}>{preset.name}</option>
        {/each}
      </select>
      {#each priorPresets[priorPresetIndex].paramDefs as param}
        <div class="param-slider">
          <label>
            {param.label}: {priorParams[param.name]?.toFixed(2) ?? param.default.toFixed(2)}
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={priorParams[param.name] ?? param.default}
              oninput={(e) => handlePriorParamChange(param.name, e)}
            />
          </label>
        </div>
      {/each}
      {#if priorFreeEdit}
        <div class="free-edit-badge">
          <span>Free editing</span>
          <button class="reset-parametric" onclick={resetPriorToParametric}>Reset to parametric</button>
        </div>
      {/if}
    </div>

    <!-- Likelihood controls -->
    <div class="control-group">
      <span class="group-label">Likelihood</span>
      <select value={likPresetIndex} onchange={handleLikPresetChange} aria-label="Likelihood preset">
        {#each likelihoodPresets as preset, i}
          <option value={i}>{preset.name}</option>
        {/each}
      </select>
      {#each likelihoodPresets[likPresetIndex].paramDefs as param}
        <div class="param-slider">
          <label>
            {param.label}: {likParams[param.name]?.toFixed(2) ?? param.default.toFixed(2)}
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={likParams[param.name] ?? param.default}
              oninput={(e) => handleLikParamChange(param.name, e)}
            />
          </label>
        </div>
      {/each}
      {#if likFreeEdit}
        <div class="free-edit-badge">
          <span>Free editing</span>
          <button class="reset-parametric" onclick={resetLikToParametric}>Reset to parametric</button>
        </div>
      {/if}
    </div>

    <!-- Global controls -->
    <div class="control-group">
      <span class="group-label">Settings</span>
      <div class="param-slider">
        <label>
          Control points: {numControlPoints}
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={numControlPoints}
            oninput={handleControlPointsChange}
          />
        </label>
      </div>
      <div class="param-slider">
        <span class="param-label">Log base</span>
        <div class="toggle-group">
          <button
            class:active={logBase === 2}
            onclick={() => logBase = 2}
          >bits (log₂)</button>
          <button
            class:active={logBase === Math.E}
            onclick={() => logBase = Math.E}
          >nats (ln)</button>
        </div>
      </div>
      <button class="reset-btn" onclick={onReset}>Reset all</button>
    </div>
  </div>
</div>

<style>
  .controls {
    background: var(--bg-surface);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .controls-row {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .control-group {
    flex: 1;
    min-width: 200px;
  }

  .group-label {
    display: block;
    font-weight: 600;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }

  select {
    width: 100%;
    padding: 0.4rem 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--border-default);
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .param-slider {
    margin-bottom: 0.4rem;
  }

  .param-slider label,
  .param-slider .param-label {
    display: block;
    font-size: 0.78rem;
    color: var(--text-muted);
    margin-bottom: 0.15rem;
  }

  .param-slider input[type="range"] {
    width: 100%;
    height: 6px;
    accent-color: var(--text-faint);
  }

  .free-edit-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.3rem;
    font-size: 0.78rem;
    color: var(--warning-text);
  }

  .reset-parametric {
    font-size: 0.72rem;
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    border: 1px solid var(--border-default);
    background: var(--input-bg);
    color: var(--text-muted);
    cursor: pointer;
  }

  .reset-parametric:hover {
    background: var(--input-bg-hover);
  }

  .toggle-group {
    display: flex;
    gap: 0;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--border-default);
  }

  .toggle-group button {
    flex: 1;
    padding: 0.3rem 0.5rem;
    font-size: 0.75rem;
    border: none;
    background: var(--input-bg);
    color: var(--text-muted);
    cursor: pointer;
  }

  .toggle-group button.active {
    background: var(--bg-surface-strong);
    color: var(--text-primary);
    font-weight: 600;
  }

  .toggle-group button:hover:not(.active) {
    background: var(--input-bg-hover);
  }

  .reset-btn {
    margin-top: 0.5rem;
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    border-radius: 4px;
    border: 1px solid var(--reset-border);
    background: var(--reset-bg);
    color: var(--reset-text);
    cursor: pointer;
    width: 100%;
  }

  .reset-btn:hover {
    background: var(--reset-bg-hover);
    border-color: var(--reset-border-hover);
  }

  @media (max-width: 768px) {
    .controls-row {
      flex-direction: column;
    }
  }
</style>
