<script>
  import katex from 'katex';
  import 'katex/dist/katex.min.css';
  import { KL_COLOR_HEX, R_COLOR_HEX } from '../lib/colors.js';

  let {
    kl = 0,
    r = 0,
    surprisal = 0,
    unit = 'bits',
  } = $props();

  let container;

  function tex(str) {
    return katex.renderToString(str, { throwOnError: false, trust: true });
  }

  function formatVal(v) {
    if (!Number.isFinite(v)) return '\\text{undefined}';
    if (Math.abs(v) < 0.001 && v !== 0) return v.toExponential(2);
    return v.toFixed(3);
  }

  $effect(() => {
    if (container) {
      const equation = String.raw`
        \begin{aligned}
        \underbrace{-\log \mathbb{E}_{p_Z}[\operatorname{lik}_u(Z)]}_{\mathrm{surprisal}(u)}
        &\;=\;
        \underbrace{\color{${KL_COLOR_HEX}}D_{\mathrm{KL}}\bigl(p_{Z \mid u} \,\|\, p_Z\bigr)}_{\color{${KL_COLOR_HEX}}\text{update size}}
        \;+\;
        \underbrace{\color{${R_COLOR_HEX}}\mathbb{E}_{p_{Z \mid u}}\bigl[-\log \operatorname{lik}_u(Z)\bigr]}_{\color{${R_COLOR_HEX}}R(u)}
        \\[12pt]
        ${formatVal(surprisal)} \text{ ${unit}}
        &\;=\;
        {\color{${KL_COLOR_HEX}}${formatVal(kl)}} \text{ ${unit}}
        \;+\;
        {\color{${R_COLOR_HEX}}${formatVal(r)}} \text{ ${unit}}
        \end{aligned}
      `;
      katex.render(equation, container, {
        displayMode: true,
        throwOnError: false,
        trust: true,
      });
    }
  });
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<p class="equation-description">
  <strong>Setting:</strong>
  Beliefs about latent {@html tex('Z')} change upon observation {@html tex('u')} from a prior {@html tex('p_Z')} to posterior {@html tex('p_{Z \\mid u}')}.
  The raw Shannon information {@html tex('u')} carries (its surprisal) decomposes into the size of the belief update ({@html tex(String.raw`{\color{${KL_COLOR_HEX}}D_{\mathrm{KL}}}`)}) plus the remaining expected surprisal of {@html tex('u')} under the updated beliefs (reconstruction information, {@html tex(String.raw`{\color{${R_COLOR_HEX}}R}`)}).</p>
<div class="equation-display" bind:this={container}></div>

<style>
  .equation-description {
    font-size: 0.85rem;
    color: var(--text-muted);
    line-height: 1.5;
    margin: 0 0 1rem 0;
  }

  .equation-display {
    overflow-x: auto;
  }

  :global(.equation-display .katex) {
    font-size: 1.1rem;
  }

  :global(.equation-display .katex-display) {
    margin: 0;
  }
</style>
