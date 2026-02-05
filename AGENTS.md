# CLAUDE.md

This file provides guidance to AI coding assistants (Claude Code, Cursor, etc.) when working with this repository.

## Build Commands

```bash
npm run dev      # Start development server (hot reload)
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
```

## Architecture

Interactive visualization of Bayesian belief updating built with Svelte 5 + D3 + KaTeX.

### Data Flow

All state lives in `App.svelte`. The core reactive loop:
1. User edits `prior` or `likelihood` arrays (via DistributionChart drag/input)
2. `computeAll()` derives `posterior`, `kl`, `surprisal`, `r` from these arrays
3. Child components reactively render the new values

### Key Files

- **`src/lib/math.js`** - Pure functions for Bayesian computations. `computeAll(prior, likelihood, logBase)` is the main entry point returning `{posterior, kl, surprisal, r, marginalLikelihood}`.

- **`src/lib/presets.js`** - Distribution generators (uniform, iidUniform, iidLogUniform, iidBernoulli). Each returns an array of the requested size.

- **`src/lib/colors.js`** - HSL color functions. `priorColor(value)` → red, `likelihoodColor(value)` → blue, `posteriorColor(value, prior, lik)` → purple with hue varying by contribution ratio.

- **`src/components/DistributionChart.svelte`** - Reusable horizontal bar chart. Accepts `values` (bindable), `colorFn`, `editable`, `isPrior` (triggers auto-normalization), `useLogScale`. Uses D3 for scales only; bars rendered declaratively in Svelte.

### Math Identity

The visualization demonstrates: `surprisal(u) = KL(post‖prior) + R(u)`

Where:
- `surprisal = -log E_prior[likelihood]`
- `KL = Σ posterior[i] * log(posterior[i] / prior[i])`
- `R = E_posterior[-log likelihood]`

### Svelte 5 Patterns

Uses runes (`$state`, `$derived`, `$effect`, `$bindable`, `$props`). Components use `bind:values` for two-way binding on editable distributions.

### Zero Handling

When `allowZeroes` is OFF, all values are clamped to `epsilon` (default 1e-6). Log sliders are only available when `allowZeroes` is OFF (log(0) is undefined). Functions return `null` for undefined posteriors (when marginal likelihood = 0).

## Coding Style

### Prefer Functional Methods Over Loops

When writing JavaScript, prefer functional array methods like `.map()`, `.filter()`, `.reduce()`, `.some()`, `.every()` over imperative loops.

**Instead of:**
```javascript
function sum(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}
```

**Do:**
```javascript
function sum(arr) {
  return arr.reduce((acc, val) => acc + val, 0);
}
```

## Git Practices

Commit early and often with informative messages. Each commit should represent a single logical change:

- Commit after completing a feature, fix, or refactor
- Commit before switching to a different task
- Use imperative mood in commit messages ("Add feature" not "Added feature")
- Keep the first line under 50 characters, add detail in the body if needed

**Good commit messages:**
- `Add KL divergence computation`
- `Fix posterior normalization edge case`
- `Refactor color functions to use HSL`

**Avoid:**
- `WIP`
- `fix`
- `updates`
