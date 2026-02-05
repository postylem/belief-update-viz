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

  // Render the main equation
  const mainEquation = String.raw`
    \underbrace{\color{#9966cc}D_{\mathrm{KL}}(p_{Z|u} \,\|\, p_Z)}_{\text{KL divergence}}
    \;=\;
    \underbrace{-\log \mathbb{E}_{p_Z}[p(u|z)]}_{\text{surprisal}(u)}
    \;-\;
    \underbrace{\color{#33aaaa}\mathbb{E}_{p_{Z|u}}[-\log p(u|z)]}_{\text{R}(u)}
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
        \color{#9966cc}${formatVal(kl)}
        \;=\;
        ${formatVal(surprisal)}
        \;-\;
        \color{#33aaaa}${formatVal(r)}
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
    background: rgba(255, 255, 255, 0.03);
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
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  :global(.equation-display .katex) {
    font-size: 1.1rem;
  }

  :global(.equation-display .katex-display) {
    margin: 0;
  }
</style>
