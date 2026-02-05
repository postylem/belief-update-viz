<script>
  let {
    labels = $bindable([]),
    epsilon = $bindable(1e-6),
    expanded = $bindable(false),
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
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    cursor: pointer;
    padding: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .toggle-btn:hover {
    color: rgba(255, 255, 255, 0.9);
  }

  .arrow {
    font-size: 0.7rem;
    transition: transform 0.15s ease;
  }

  .panel-content {
    background: rgba(255, 255, 255, 0.03);
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
    color: rgba(255, 255, 255, 0.9);
  }

  .description {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
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
    color: rgba(255, 255, 255, 0.5);
    min-width: 1.5rem;
  }

  .label-input input {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    color: white;
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
  }

  .label-input input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.3);
  }

  .epsilon-input {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .epsilon-input input {
    width: 100px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    color: white;
    padding: 0.3rem 0.5rem;
    font-size: 0.85rem;
    font-family: monospace;
  }

  .epsilon-input input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.3);
  }

  .hint {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }
</style>
