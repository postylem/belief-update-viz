<script>
  import { priorPresets, likelihoodPresets } from '../lib/presets.js';

  let {
    supportSize = $bindable(4),
    logBase = $bindable(2),
    allowZeroes = $bindable(false),
    useLogSliders = $bindable(false),
    onApplyPriorPreset = () => {},
    onApplyLikelihoodPreset = () => {},
    onReset = () => {},
  } = $props();

  // When allowZeroes is turned ON, disable log sliders
  $effect(() => {
    if (allowZeroes && useLogSliders) {
      useLogSliders = false;
    }
  });

  function handlePriorPreset(event) {
    const key = event.target.value;
    if (key && priorPresets[key]) {
      onApplyPriorPreset(priorPresets[key].generator);
      event.target.value = '';
    }
  }

  function handleLikelihoodPreset(event) {
    const key = event.target.value;
    if (key && likelihoodPresets[key]) {
      onApplyLikelihoodPreset(likelihoodPresets[key].generator);
      event.target.value = '';
    }
  }
</script>

<div class="controls">
  <div class="control-group">
    <label>
      Support size
      <input
        type="range"
        min="2"
        max="20"
        bind:value={supportSize}
      />
      <span class="value">{supportSize}</span>
    </label>
  </div>

  <div class="control-group presets">
    <div class="preset-select">
      <label for="prior-preset">Prior preset:</label>
      <select id="prior-preset" onchange={handlePriorPreset}>
        <option value="">Select...</option>
        {#each Object.entries(priorPresets) as [key, preset]}
          <option value={key}>{preset.name}</option>
        {/each}
      </select>
    </div>

    <div class="preset-select">
      <label for="lik-preset">Likelihood preset:</label>
      <select id="lik-preset" onchange={handleLikelihoodPreset}>
        <option value="">Select...</option>
        {#each Object.entries(likelihoodPresets) as [key, preset]}
          <option value={key}>{preset.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="control-group toggles">
    <label class="toggle">
      <input
        type="radio"
        name="unit"
        value={2}
        checked={logBase === 2}
        onchange={() => logBase = 2}
      />
      Bits
    </label>
    <label class="toggle">
      <input
        type="radio"
        name="unit"
        value={Math.E}
        checked={logBase === Math.E}
        onchange={() => logBase = Math.E}
      />
      Nats
    </label>
  </div>

  <div class="control-group toggles">
    <label class="checkbox">
      <input
        type="checkbox"
        bind:checked={allowZeroes}
      />
      Allow zeroes
    </label>

    <label class="checkbox" class:disabled={allowZeroes}>
      <input
        type="checkbox"
        bind:checked={useLogSliders}
        disabled={allowZeroes}
      />
      Log sliders
      {#if allowZeroes}
        <span class="hint">(disabled with zeroes)</span>
      {/if}
    </label>
  </div>

  <div class="control-group">
    <button class="reset-btn" onclick={onReset}>
      Reset
    </button>
  </div>
</div>

<style>
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: flex-start;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .control-group.presets {
    flex-direction: row;
    gap: 1rem;
  }

  .control-group.toggles {
    flex-direction: row;
    gap: 1rem;
    align-items: center;
  }

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .preset-select {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .preset-select label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }

  select {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: white;
    padding: 0.4rem 0.6rem;
    font-size: 0.85rem;
    cursor: pointer;
  }

  select:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  input[type="range"] {
    width: 100px;
    cursor: pointer;
  }

  .value {
    min-width: 2ch;
    text-align: right;
    font-family: monospace;
  }

  .toggle, .checkbox {
    cursor: pointer;
    user-select: none;
  }

  .checkbox.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .hint {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
  }

  input[type="radio"],
  input[type="checkbox"] {
    cursor: pointer;
  }

  .reset-btn {
    background: rgba(255, 100, 100, 0.2);
    border: 1px solid rgba(255, 100, 100, 0.4);
    border-radius: 4px;
    color: rgba(255, 200, 200, 0.9);
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .reset-btn:hover {
    background: rgba(255, 100, 100, 0.3);
    border-color: rgba(255, 100, 100, 0.6);
  }
</style>
