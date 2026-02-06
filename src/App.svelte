<script>
  import DiscreteApp from './DiscreteApp.svelte';
  import ContinuousApp from './ContinuousApp.svelte';

  // Theme state - initialize from localStorage
  let lightTheme = $state(
    typeof localStorage !== 'undefined' && localStorage.getItem('theme') === 'light'
  );

  // Apply theme to document root and persist to localStorage
  $effect(() => {
    if (lightTheme) {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  });

  // Mode toggle
  let mode = $state('discrete');
</script>

<main>
  <header>
    <h1>Belief update size and surprisal decomposition</h1>
    <div class="header-actions">
      <div class="mode-toggle">
        <button
          class:active={mode === 'discrete'}
          onclick={() => mode = 'discrete'}
        >Discrete</button>
        <button
          class:active={mode === 'continuous'}
          onclick={() => mode = 'continuous'}
        >Continuous</button>
      </div>
      <button
        class="theme-toggle"
        onclick={() => lightTheme = !lightTheme}
        title={lightTheme ? 'Switch to dark theme' : 'Switch to light theme'}
      >
        {lightTheme ? '⏾' : '☀︎'}
      </button>
    </div>
  </header>

  {#if mode === 'discrete'}
    <DiscreteApp />
  {:else}
    <ContinuousApp />
  {/if}
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
    font-size: 1.4rem;
    color: var(--text-primary);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .mode-toggle {
    display: flex;
    gap: 0;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--border-default);
  }

  .mode-toggle button {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    font-family: inherit;
    border: none;
    background: var(--bg-surface);
    color: var(--text-muted);
    cursor: pointer;
  }

  .mode-toggle button.active {
    background: var(--bg-surface-strong);
    color: var(--text-primary);
    font-weight: 600;
  }

  .mode-toggle button:hover:not(.active) {
    background: var(--bg-surface-hover);
  }

  .theme-toggle {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    font-size: 1.25rem;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .theme-toggle:hover {
    background: var(--bg-surface-hover);
    border-color: var(--border-strong);
  }

  @media (max-width: 768px) {
    main {
      padding: 1rem;
    }

    h1 {
      font-size: 1.1rem;
    }
  }
</style>
