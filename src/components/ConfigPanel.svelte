<script>
  let {
    labels = $bindable([]),
    epsilon = $bindable(1e-6),
    surprisalAxisMax = $bindable(6),
    expanded = $bindable(false),
    onResetAll = () => {},
  } = $props();

  function handleLabelChange(index, event) {
    const newLabels = [...labels];
    newLabels[index] = event.target.value;
    labels = newLabels;
  }

  function handleEpsilonChange(event) {
    const val = parseFloat(event.target.value);
    if (!isNaN(val) && val > 0 && val < 1) {
      epsilon = val;
    }
  }

  function handleAxisMaxChange(event) {
    const val = parseFloat(event.target.value);
    if (!isNaN(val) && val > 0) {
      surprisalAxisMax = val;
    }
  }
</script>

<div class="config-panel">
  <button
    class="toggle-btn"
    onclick={() => expanded = !expanded}
    aria-expanded={expanded}
  >
    <span class="arrow" class:expanded>{expanded ? '▼' : '▶'}</span>
    More options
  </button>

  {#if expanded}
    <div class="panel-content">
      <div class="section">
        <h4>State Labels</h4>
        <div class="labels-grid">
          {#each labels as label, i}
            <div class="label-input">
              <span class="label-index">{i + 1}.</span>
              <input
                type="text"
                value={label}
                onchange={(e) => handleLabelChange(i, e)}
                placeholder={`State ${i + 1}`}
              />
            </div>
          {/each}
        </div>
      </div>

      <div class="section">
        <h4>Minimum Value (ε)</h4>
        <p class="description">
          When "Allow zeroes" is OFF, this is the minimum value for sliders.
        </p>
        <div class="epsilon-input">
          <input
            type="text"
            value={epsilon}
            onchange={handleEpsilonChange}
          />
          <span class="hint">e.g., 1e-6, 0.001</span>
        </div>
      </div>

      <div class="section">
        <h4>Surprisal Axis Maximum</h4>
        <p class="description">
          Default maximum for the surprisal bar axis (in bits/nats). The axis auto-scales when surprisal exceeds this value.
        </p>
        <div class="axis-max-input">
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            bind:value={surprisalAxisMax}
          />
          <input
            type="text"
            value={surprisalAxisMax}
            onchange={handleAxisMaxChange}
          />
        </div>
      </div>

      <div class="section reset-section">
        <button class="reset-all-btn" onclick={onResetAll}>
          Reset All to Defaults
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
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

  h4 {
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

  .labels-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.5rem;
  }

  .label-input {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .label-index {
    font-size: 0.75rem;
    color: var(--text-faint);
    min-width: 1.5rem;
  }

  .label-input input {
    flex: 1;
    background: var(--input-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    color: var(--text-primary);
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
  }

  .label-input input:focus {
    outline: none;
    border-color: var(--border-strong);
  }

  .epsilon-input {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .epsilon-input input {
    width: 100px;
    background: var(--input-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    color: var(--text-primary);
    padding: 0.3rem 0.5rem;
    font-size: 0.85rem;
    font-family: monospace;
  }

  .epsilon-input input:focus {
    outline: none;
    border-color: var(--border-strong);
  }

  .hint {
    font-size: 0.75rem;
    color: var(--text-faintest);
  }

  .axis-max-input {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .axis-max-input input[type="range"] {
    flex: 1;
    max-width: 200px;
    cursor: pointer;
  }

  .axis-max-input input[type="text"] {
    width: 60px;
    background: var(--input-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    color: var(--text-primary);
    padding: 0.3rem 0.5rem;
    font-size: 0.85rem;
    font-family: monospace;
    text-align: right;
  }

  .axis-max-input input[type="text"]:focus {
    outline: none;
    border-color: var(--border-strong);
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
</style>
