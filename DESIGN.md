# Belief Update Size and Surprisal Decomposition

## Overview

An interactive single-page visualization demonstrating Bayesian belief updating. A toggle switches between **discrete** mode (finite support, draggable bars) and **continuous** mode (density curves with draggable control points). Users manipulate prior beliefs and likelihood functions, observing in real-time how the posterior distribution changes and how the information-theoretic surprisal decomposes into KL divergence and a residual 'reconstruction information' term.

## Mathematical Foundation

### The Setup

We define the **likelihood function** $\operatorname{lik}_u(z) \coloneqq p(u \mid z)$, which gives the probability of observing outcome $u$ given each possible state of $Z$.

**Discrete case**: $Z$ has finite support $\{z_1, z_2, \ldots, z_n\}$ with prior $p(Z)$.

**Continuous case**: $Z \in [0, 1]$ with prior density $f_Z(z)$.

### Bayes' Theorem

**Discrete**:

$$p(Z \mid u) = \frac{\operatorname{lik}_u(Z) \cdot p(Z)}{p(u)}$$

where the marginal likelihood is:

$$p(u) = \mathbb{E}_{p(Z)}[\operatorname{lik}_u(Z)] = \sum_z \operatorname{lik}_u(z) \cdot p(z)$$

**Continuous**:

$$f_{Z|u}(z) = \frac{\operatorname{lik}_u(z) \cdot f_Z(z)}{p(u)}$$

where:

$$p(u) = \int \operatorname{lik}_u(z) \, f_Z(z) \, dz$$

### Surprisal Decomposition

The core identity visualized by this tool:

$$\underbrace{-\log \mathbb{E}[\operatorname{lik}_u(Z)]}_{\text{surprisal}(u)} = \underbrace{D_{\mathrm{KL}}(\text{post} \,\|\, \text{prior})}_{D_{\mathrm{KL}}} + \underbrace{\mathbb{E}_{\text{post}}[-\log \operatorname{lik}_u(Z)]}_{R(u)}$$

Where:
- **Surprisal**: $-\log p(u)$ — how unexpected the observation was under our prior predictive distribution
- **KL Divergence**: $D_{\mathrm{KL}}(\text{post} \| \text{prior})$ — how much our beliefs shifted due to the observation
- **R (Reconstruction Information)**: $\mathbb{E}_{\text{post}}[-\log \operatorname{lik}_u(Z)]$ — expected surprisal of the likelihood under the posterior

This decomposition shows that the total surprisal of an observation splits into two components: the information gained about $Z$ (KL) and the residual 'reconstruction information' (R).

### Computation Methods

**Discrete case — exact arithmetic** (`computeAll` in `src/lib/math.js`):

With finite support $\{z_1, \ldots, z_n\}$, every expectation and divergence reduces to a finite sum over the $n$ states. These sums are computed directly with no approximation:

- Marginal likelihood: $p(u) = \sum_i \operatorname{lik}_u(z_i) \, p(z_i)$ — a dot product (`computeMarginalLikelihood`)
- Posterior: $p(z_i \mid u) = \frac{\operatorname{lik}_u(z_i) \, p(z_i)}{p(u)}$ — elementwise multiply and normalize (`computePosterior`)
- KL: $\sum_i p(z_i \mid u) \log \frac{p(z_i \mid u)}{p(z_i)}$ — weighted sum (`computeKL`)
- R: $\sum_i p(z_i \mid u) \bigl[-\log \operatorname{lik}_u(z_i)\bigr]$ — weighted sum (`computeR`)

The only source of error is floating-point precision.

**Continuous case — numerical integration** (`computeAllContinuous` in `src/lib/math.js`):

With a continuous density over $[0,1]$, sums become integrals. We discretize the domain onto a uniform grid of $N = 300$ points with spacing $\Delta z = 1/(N-1)$ and approximate each integral using the **composite trapezoidal rule** (`trapz`):

$$\int_0^1 g(z)\,dz \;\approx\; \Delta z \left[\tfrac{g(z_0)}{2} + g(z_1) + g(z_2) + \cdots + g(z_{N-2}) + \tfrac{g(z_{N-1})}{2}\right]$$

This weights the two boundary values by $\frac{1}{2}$ and all interior values by $1$, then multiplies by $\Delta z$. It is second-order accurate: the global error is $O(\Delta z^2)$, so with 300 points the approximation is accurate to roughly $10^{-5}$. See [Composite trapezoidal rule — Wikipedia](https://en.wikipedia.org/wiki/Trapezoidal_rule#Composite_trapezoidal_rule) for a derivation and error analysis.

Each continuous quantity is computed by forming the appropriate integrand array and passing it to `trapz`:

- Marginal likelihood: $p(u) = \int \operatorname{lik}_u(z) \, f_Z(z) \, dz$ — `trapz` of the elementwise product
- Posterior density: $f_{Z|u}(z) = \frac{\operatorname{lik}_u(z) \, f_Z(z)}{p(u)}$ — divide unnormalized product by the scalar marginal likelihood
- KL: $\int f_{Z|u}(z) \log \frac{f_{Z|u}(z)}{f_Z(z)} \, dz$ — `trapz` of the pointwise KL integrand
- R: $\int f_{Z|u}(z) [-\log \operatorname{lik}_u(z)] \, dz$ — `trapz` of the pointwise R integrand

Density normalization (`normalizeDensity`) also uses `trapz` to ensure the prior integrates to 1.

## Features

### Mode Toggle

A segmented control in the header switches between Discrete and Continuous mode. Each mode preserves its own state independently.

### Discrete Mode

#### Distribution Editing

- **Draggable bars**: Click and drag horizontal bars to adjust values
- **Numeric inputs**: Direct text entry for precise values (editable charts only)
- **Auto-normalization**: Prior values automatically normalize to sum to 1
- **Constraints**: Likelihood values constrained to $[0, 1]$

#### Presets

**Prior presets**:
- Uniform — equal probability across all states
- Random (Uniform) — random values from $U[0,1]$, normalized
- Random (Log-Uniform) — random values favoring smaller probabilities
- Random (Sparse) — binary values (Bernoulli), normalized
- Peaked — most mass on one random state

**Likelihood presets**:
- Uniform — all states equally likely to produce observation ($\operatorname{lik}_u(z) = 1$)
- Random variations — uniform, log-uniform, sparse
- Discriminating — high likelihood for one state, low for others

#### Display Options

- **Units**: Toggle between bits (log base 2) and nats (natural log)
- **Support size**: Adjustable from 2 to 20 states
- **Allow zeroes**: Toggle whether zero probabilities are permitted
- **Log sliders**: When zeros disallowed, enables logarithmic slider mapping for fine control of small values

### Continuous Mode

#### Representation

Two-layer approach:
- **Editing layer**: ~30 control points with y-values the user drags vertically. X-positions evenly spaced across the domain $[0, 1]$.
- **Computation layer**: Control points are interpolated onto a 300-point grid via monotone cubic (Fritsch-Carlson) interpolation, preserving non-negativity.

#### Interaction Modes

1. **Parametric mode** (default): User selects a distribution family and adjusts parameters via sliders. Sliders regenerate control points in real time.
2. **Free-edit mode**: User drags control points directly. Entering free-edit detaches from parametric sliders. A "Reset to parametric" button re-applies slider values.

#### Prior Constraints
- Auto-renormalized so density integrates to 1
- Non-negativity enforced (control points clamped to $\geq 0$)

#### Likelihood
- Values constrained to $[0, 1]$ (likelihood is a probability, not a density)
- No normalization constraint
- Non-negative

#### Presets

**Prior presets**: Uniform, Truncated Normal, Beta, Bimodal
**Likelihood presets**: Uniform, Truncated Normal, Step, Linear, Bimodal

### Shared Display

- **Surprisal bar**: Visual decomposition showing KL and R as proportional segments
- **Equation display**: KaTeX-rendered mathematical identity with current numeric values
- **Color coding**:
  - Prior: red hues (saturation varies with value)
  - Likelihood: blue hues
  - Posterior: purple hues (redder when the prior supports the state's mass, bluer when the likelihood does; measured by |log| penalty from each factor)
  - KL segment: purple
  - R segment: teal

## Architecture

### Technology Stack

- **Svelte 5**: Reactive UI framework using runes (`$state`, `$derived`, `$effect`)
- **D3.js**: Scales for chart layout (rendering is declarative Svelte)
- **KaTeX**: LaTeX math rendering
- **Vite**: Build tooling and dev server

### Project Structure

```
src/
├── main.js                 # Single entry point
├── App.svelte              # Shell: header, mode toggle, theme
├── DiscreteApp.svelte      # Discrete mode state management
├── ContinuousApp.svelte    # Continuous mode state management
├── lib/
│   ├── math.js             # Bayesian computations (discrete + continuous)
│   ├── presets.js          # Discrete distribution generators
│   ├── continuousPresets.js # Continuous PDF generators
│   ├── interpolation.js    # Monotone cubic interpolation
│   └── colors.js           # HSL color functions
├── components/
│   ├── DistributionChart.svelte   # Discrete: editable bar chart
│   ├── CurveChart.svelte          # Continuous: SVG area chart
│   ├── ContinuousControls.svelte  # Continuous: preset + param controls
│   ├── SurprisalBar.svelte        # Shared: KL + R decomposition bar
│   ├── EquationDisplay.svelte     # Shared: KaTeX equation rendering
│   ├── Controls.svelte            # Discrete: presets, toggles
│   └── ConfigPanel.svelte         # Discrete: labels, epsilon config
└── styles/
    └── global.css          # Base styles, themes
index.html                  # Single HTML entry
```

### Data Flow

1. `App.svelte` manages theme and mode toggle, conditionally renders `DiscreteApp` or `ContinuousApp`
2. Each mode component manages its own state independently
3. **Discrete**: User edits `prior` or `likelihood` arrays via DistributionChart → `computeAll()` derives all quantities
4. **Continuous**: User edits control points via CurveChart → interpolation to grid → `computeAllContinuous()` derives all quantities
5. Child components use `bind:` for two-way binding

### Key Functions (`src/lib/math.js`)

- `normalize(arr)` — normalize array to sum to 1, returns null if sum is 0
- `computePosterior(prior, likelihood)` — Bayes' theorem
- `computeMarginalLikelihood(prior, likelihood)` — evidence $p(u)$
- `computeSurprisal(prior, likelihood, logBase)` — $-\log p(u)$
- `computeKL(posterior, prior, logBase)` — KL divergence
- `computeR(posterior, likelihood, logBase)` — reconstruction information term
- `computeAll(...)` — returns all derived quantities (discrete)
- `computeAllContinuous(...)` — returns all derived quantities (continuous, trapezoidal integration)
- `normalizeDensity(arr, dz)` — normalize so integral = 1
- `trapz(arr, dz)` — trapezoidal integration with uniform spacing

## Edge Cases

### Zero Handling (Discrete)

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

- **Horizontal bars** (discrete): Probability on x-axis, states on y-axis — reads naturally
- **Vertical area charts** (continuous): Standard math convention — z on x-axis, density on y-axis
- **Single-page architecture**: Discrete and continuous modes share one page with a toggle, sharing theme management and header
- **Instant updates**: No CSS transitions on data changes for responsive feel
- **Dark theme option**: Reduces eye strain, good contrast for colored bars, but also works in light theme
- **KaTeX everywhere**: Consistent mathematical typography
- **Functional style**: Pure computation functions, array methods over loops
