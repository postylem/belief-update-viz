# Bayesian Belief Update Visualization

## Overview

An interactive browser-based visualization demonstrating Bayesian belief updating over discrete probability distributions. Users manipulate prior beliefs and likelihood functions via draggable bars, observing in real-time how the posterior distribution changes and how the information-theoretic surprisal decomposes into KL divergence and a residual term.

## Mathematical Foundation

### The Setup

Consider a discrete latent variable $Z$ with finite support $\{z_1, z_2, \ldots, z_n\}$. We have:

- **Prior** $p(Z)$: Our initial belief distribution over $Z$ before observing data
- **Likelihood** $p(u \mid Z)$: The probability of observing outcome $u$ given each possible state of $Z$
- **Posterior** $p(Z \mid u)$: Our updated belief after observing $u$

### Bayes' Theorem

The posterior is computed via Bayes' theorem:

$$p(Z \mid u) = \frac{p(u \mid Z) \cdot p(Z)}{p(u)}$$

where the marginal likelihood (evidence) is:

$$p(u) = \mathbb{E}_{p(Z)}[p(u \mid Z)] = \sum_z p(u \mid z) \cdot p(z)$$

### Surprisal Decomposition

The core identity visualized by this tool:

$$\underbrace{-\log \mathbb{E}_{p_Z}[p(u \mid Z)]}_{\text{surprisal}(u)} = \underbrace{D_{\mathrm{KL}}(p_{Z \mid u} \,\|\, p_Z)}_{D_{\mathrm{KL}}} + \underbrace{\mathbb{E}_{p_{Z \mid u}}[-\log p(u \mid Z)]}_{R(u)}$$

Where:
- **Surprisal**: $-\log p(u)$ — how unexpected the observation was under our prior predictive distribution
- **KL Divergence**: $D_{\mathrm{KL}}(p_{Z|u} \| p_Z)$ — how much our beliefs shifted due to the observation
- **R (Residual)**: $\mathbb{E}_{p_{Z|u}}[-\log p(u|Z)]$ — expected surprisal of the likelihood under the posterior

This decomposition shows that the total surprisal of an observation splits into two components: the information gained about $Z$ (KL) and the residual uncertainty about the observation mechanism (R).

## Features

### Distribution Editing

- **Draggable bars**: Click and drag horizontal bars to adjust values
- **Numeric inputs**: Direct text entry for precise values (editable charts only)
- **Auto-normalization**: Prior values automatically normalize to sum to 1
- **Constraints**: Likelihood values constrained to $[0, 1]$

### Presets

Pre-configured distributions for exploration:

**Prior presets**:
- Uniform — equal probability across all states
- Random (Uniform) — random values from $U[0,1]$, normalized
- Random (Log-Uniform) — random values favoring smaller probabilities
- Random (Sparse) — binary values (Bernoulli), normalized
- Peaked — most mass on one random state

**Likelihood presets**:
- Uniform — all states equally likely to produce observation ($p(u|z) = 1$)
- Random variations — uniform, log-uniform, sparse
- Discriminating — high likelihood for one state, low for others

### Display Options

- **Units**: Toggle between bits (log base 2) and nats (natural log)
- **Support size**: Adjustable from 2 to 20 states
- **Allow zeroes**: Toggle whether zero probabilities are permitted
- **Log sliders**: When zeros disallowed, enables logarithmic slider mapping for fine control of small values

### Information Display

- **Surprisal bar**: Visual decomposition showing KL and R as proportional segments
- **Equation display**: KaTeX-rendered mathematical identity with current numeric values
- **Color coding**:
  - Prior: red hues (saturation varies with value)
  - Likelihood: blue hues
  - Posterior: purple hues (hue varies by prior/likelihood contribution ratio)
  - KL segment: purple
  - R segment: teal

## Architecture

### Technology Stack

- **Svelte 5**: Reactive UI framework using runes (`$state`, `$derived`, `$effect`)
- **D3.js**: Scales for bar chart layout (rendering is declarative Svelte)
- **KaTeX**: LaTeX math rendering
- **Vite**: Build tooling and dev server

### Project Structure

```
src/
├── main.js                 # App entry point
├── App.svelte              # Main component, state management
├── lib/
│   ├── math.js             # Bayesian computations (pure functions)
│   ├── presets.js          # Distribution generators
│   └── colors.js           # HSL color functions
├── components/
│   ├── DistributionChart.svelte   # Editable/display bar chart
│   ├── SurprisalBar.svelte        # KL + R decomposition bar
│   ├── EquationDisplay.svelte     # KaTeX equation rendering
│   ├── Controls.svelte            # Presets, toggles, settings
│   └── ConfigPanel.svelte         # State labels, epsilon config
└── styles/
    └── global.css          # Base styles, dark theme
```

### Data Flow

1. User edits `prior` or `likelihood` arrays via DistributionChart
2. `computeAll(prior, likelihood, logBase)` derives all quantities
3. Child components reactively render updated values
4. All state lives in App.svelte; child components use `bind:` for two-way binding

### Key Functions (`src/lib/math.js`)

- `normalize(arr)` — normalize array to sum to 1, returns null if sum is 0
- `computePosterior(prior, likelihood)` — Bayes' theorem
- `computeMarginalLikelihood(prior, likelihood)` — evidence $p(u)$
- `computeSurprisal(prior, likelihood, logBase)` — $-\log p(u)$
- `computeKL(posterior, prior, logBase)` — KL divergence
- `computeR(posterior, likelihood, logBase)` — residual term
- `computeAll(...)` — returns all derived quantities

## Edge Cases

### Zero Handling

When "Allow zeroes" is OFF (default):
- All values clamped to $\epsilon$ (configurable, default $10^{-6}$)
- Log sliders available for fine control of small values

When "Allow zeroes" is ON:
- True zeros permitted
- Log sliders disabled (incompatible with $\log(0)$)
- Degenerate cases handled gracefully:
  - All prior values zero → "Prior undefined" message
  - Marginal likelihood zero → "Posterior undefined" message
  - Posterior positive where prior zero → KL = $\infty$
  - Posterior positive where likelihood zero → R = $\infty$

## Design Decisions

- **Horizontal bars**: Probability on x-axis, states on y-axis — reads naturally
- **Instant updates**: No CSS transitions on data changes for responsive feel
- **Dark theme**: Reduces eye strain, good contrast for colored bars
- **KaTeX everywhere**: Consistent mathematical typography
- **Functional style**: Pure computation functions, array methods over loops
