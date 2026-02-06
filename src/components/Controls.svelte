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
  <div class="top-row">
    <label class="support-size">
      Support size
      <input
        type="range"
        min="2"
        max="20"
        bind:value={supportSize}
      />
      <span class="value">{supportSize}</span>
    </label>

    <div class="toggles">
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

    <div class="toggles">
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
  </div>

  <div class="bottom-row">
    <div class="preset-column">
      <label for="prior-preset">Prior preset:</label>
      <select id="prior-preset" onchange={handlePriorPreset}>
        <option value="">Select...</option>
        {#each Object.entries(priorPresets) as [key, preset]}
          <option value={key}>{preset.name}</option>
        {/each}
      </select>
    </div>

    <div class="preset-column">
      <label for="lik-preset">Likelihood preset:</label>
      <select id="lik-preset" onchange={handleLikelihoodPreset}>
        <option value="">Select...</option>
        {#each Object.entries(likelihoodPresets) as [key, preset]}
          <option value={key}>{preset.name}</option>
        {/each}
      </select>
    </div>

    <div class="preset-column reset-column">
      <div class="reset-wrapper">
        <button class="reset-btn" onclick={onReset}>
          Reset
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--bg-surface);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .top-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: center;
  }

  .bottom-row {
    display: flex;
    gap: 1rem;
  }

  .preset-column {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .reset-column {
    justify-content: flex-end;
  }

  .reset-wrapper {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    height: 100%;
  }

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .preset-column > label {
    font-size: 0.75rem;
    color: var(--text-faint);
  }

  .toggles {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  select {
    background: var(--input-bg);
    border: 1px solid var(--border-default);
    border-radius: 4px;
    color: var(--text-primary);
    padding: 0.4rem 0.6rem;
    font-size: 0.85rem;
    cursor: pointer;
    width: 100%;
  }

  select:hover {
    background: var(--input-bg-hover);
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
    color: var(--text-faintest);
  }

  input[type="radio"],
  input[type="checkbox"] {
    cursor: pointer;
  }

  .reset-btn {
    background: var(--reset-bg);
    border: 1px solid var(--reset-border);
    border-radius: 4px;
    color: var(--reset-text);
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .reset-btn:hover {
    background: var(--reset-bg-hover);
    border-color: var(--reset-border-hover);
  }

  @media (max-width: 768px) {
    .top-row {
      gap: 0.75rem;
    }

    input[type="range"] {
      width: 60px;
    }
  }
</style>
