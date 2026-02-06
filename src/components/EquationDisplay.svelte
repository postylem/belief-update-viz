<script>
  import { onMount } from 'svelte';
  import katex from 'katex';
  import 'katex/dist/katex.min.css';

  let {
    kl = 0,
    r = 0,
    surprisal = 0,
    unit = 'bits',
  } = $props();

  let equationContainer;
  let valuesContainer;

  // Render the main equation: surprisal = KL + R
  const mainEquation = String.raw`
    \underbrace{-\log \mathbb{E}_{p_Z}[p(u \mid Z)]}_{\mathrm{surprisal}(u)}
    \;=\;
    \underbrace{\color{#45a085}D_{\mathrm{KL}}\bigl(p_{Z \mid u} \,\|\, p_Z\bigr)}_{\color{#45a085}D_{\mathrm{KL}}}
    \;+\;
    \underbrace{\color{#e87040}\mathbb{E}_{p_{Z \mid u}}\bigl[-\log p(u \mid Z)\bigr]}_{\color{#e87040}R(u)}
  `;

  function formatVal(v) {
    if (!Number.isFinite(v)) return '\\text{undefined}';
    if (Math.abs(v) < 0.001 && v !== 0) return v.toExponential(2);
    return v.toFixed(3);
  }

  $effect(() => {
    if (equationContainer) {
      katex.render(mainEquation, equationContainer, {
        displayMode: true,
        throwOnError: false,
        trust: true,
      });
    }
  });

  $effect(() => {
    if (valuesContainer) {
      const valuesEquation = String.raw`
        ${formatVal(surprisal)}
        \;=\;
        \color{#45a085}${formatVal(kl)}
        \;+\;
        \color{#e87040}${formatVal(r)}
        \quad \text{${unit}}
      `;
      katex.render(valuesEquation, valuesContainer, {
        displayMode: true,
        throwOnError: false,
        trust: true,
      });
    }
  });
</script>

<div class="equation-display">
  <div class="equation-main" bind:this={equationContainer}></div>
  <div class="equation-values" bind:this={valuesContainer}></div>
</div>

<style>
  .equation-display {
    background: var(--bg-surface);
    border-radius: 8px;
    padding: 1.5rem;
    margin-top: 1.5rem;
    overflow-x: auto;
  }

  .equation-main {
    margin-bottom: 1rem;
  }

  .equation-values {
    padding-top: 0.5rem;
    border-top: 1px solid var(--border-subtle);
  }

  :global(.equation-display .katex) {
    font-size: 1.1rem;
  }

  :global(.equation-display .katex-display) {
    margin: 0;
  }
</style>
