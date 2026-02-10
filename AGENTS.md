# CLAUDE.md

This file provides guidance to AI coding assistants (Claude Code, Cursor, etc.) when working with this repository.

See @DESIGN.md for project design overview.

## Build Commands

```bash
npm run dev      # Start development server (hot reload)
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
```

## Architecture

Interactive visualization of Bayesian belief updating built with Svelte 5 + D3 + KaTeX.

### Data Flow

`App.svelte` is the shell: manages theme and a discrete/continuous mode toggle. It conditionally renders `DiscreteApp` or `ContinuousApp`, each managing their own state.

**Discrete**: User edits `prior`/`likelihood` arrays → `computeAll()` derives posterior, KL, surprisal, R.
**Continuous**: User edits control points → interpolation to grid → `computeAllContinuous()` derives all quantities.

### Key Files

- **`src/App.svelte`** - Shell: header with title, mode toggle (discrete/continuous), theme toggle. Renders DiscreteApp or ContinuousApp.

- **`src/DiscreteApp.svelte`** - Discrete mode state management. Prior/likelihood arrays, support size, presets, settings.

- **`src/ContinuousApp.svelte`** - Continuous mode state management. Control point arrays, preset indices, params. Derives grid via interpolation, computes posterior via `computeAllContinuous`.

- **`src/lib/math.js`** - Pure functions for Bayesian computations. `computeAll(prior, likelihood, logBase)` for discrete, `computeAllContinuous(prior, likelihood, logBase, dz)` for continuous. Also exports `normalizeDensity`, `trapz`.

- **`src/lib/presets.js`** - Discrete distribution generators (uniform, iidUniform, iidLogUniform, iidBernoulli). Each returns an array of the requested size.

- **`src/lib/continuousPresets.js`** - Parametric PDF generators for continuous mode. Exports `priorPresets` and `likelihoodPresets` arrays with `{ name, family, defaultParams, paramDefs, generator }`.

- **`src/lib/interpolation.js`** - Monotone cubic (Fritsch-Carlson) interpolation. `interpolateMonotone(xs, ys, evalXs)` preserves non-negativity.

- **`src/lib/colors.js`** - HSL color functions. `priorColor(value)` → red, `likelihoodColor(value)` → blue, `posteriorColor(value, prior, lik)` → purple, redder when prior supports the state's mass, bluer when likelihood does.

- **`src/components/DistributionChart.svelte`** - Discrete: horizontal bar chart. Accepts `values` (bindable), `colorFn`, `editable`, `isPrior` (triggers auto-normalization), `useLogScale`.

- **`src/components/CurveChart.svelte`** - Continuous: SVG area chart with draggable control points. Accepts `controlPointYs` (bindable), `gridValues`, `gridX`, `editable`, `colorFn`.

- **`src/components/ContinuousControls.svelte`** - Continuous: preset selectors, parameter sliders, free-edit toggle, control point count.

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

## Documentation

Keep @DESIGN.md up to date as you make changes. It serves as the comprehensive design document for this project, covering:

- Mathematical foundation and formulas
- Feature descriptions and user interactions
- Architecture and project structure
- Color schemes and visual design decisions
- Edge case handling

When adding new features or modifying existing behavior, update the relevant sections in DESIGN.md to reflect the current state of the implementation.
