# Bayesian Belief Update Visualization

## Overview

An interactive browser-based visualization showing how Bayesian belief updating works. Users manipulate prior and likelihood distributions and observe how the posterior changes, along with information-theoretic diagnostics.

## Core Concepts

- **Prior** $p(z)$: Initial belief distribution over discrete support
- **Likelihood** $p(\breve{u} \mid z)$: Probability of observation given each state
- **Posterior** $p(z \mid \breve{u})$: Updated belief after observing $\breve{u}$

### Information-Theoretic Decomposition

The visualization shows the surprisal decomposition:

$$
\text{KL}(\text{post} \| \text{prior}) = \underbrace{-\log \mathbb{E}_{\text{prior}}[\text{lik}]}_{\text{surprisal}(\breve{u})} - \underbrace{\mathbb{E}_{\text{post}}[-\log \text{lik}]}_{R(\breve{u})}
$$

Where:
- **KL**: Belief update magnitude (how much beliefs changed)
- **Surprisal**: How unexpected the observation was under the prior
- **R**: Residual term (expected negative log-likelihood under posterior)

## Technology Decision

### Options

| Option | Pros | Cons |
|--------|------|------|
| **Vanilla JS + D3 + KaTeX** | Simple setup, no build step, direct control | More boilerplate for reactivity |
| **Svelte + D3 + KaTeX** | Reactive by default, clean component model, minimal overhead | Requires build step |
| **React + D3 + KaTeX** | Familiar to many, good ecosystem | Heavier, D3/React DOM conflicts |
| **Observable Framework** | Built for D3, live reactivity | Different mental model, hosting constraints |

### Recommendation

**Svelte + D3 + KaTeX** — Svelte's reactivity model fits well with "change input → see output update" interactions. D3 handles the custom bar chart rendering. KaTeX renders the math. The build step is minimal with Vite.

Alternative: **Vanilla JS + D3** if you prefer no framework overhead. Would use a simple reactive pattern (event listeners updating a state object that triggers re-renders).

**Question for you**: Do you have a preference? Framework vs vanilla? Any deployment constraints?

## Data Model

```
State {
  support: string[]           // e.g., ["z1", "z2", "z3", "z4"]
  prior: number[]             // probabilities, sum to 1
  likelihood: number[]        // p(ŭ | z) for each z, values in [0,1]
  logBase: "2" | "e"          // bits or nats
}

Derived (computed from state):
  marginalLikelihood: number  // E_prior[lik] = Σ prior[i] * likelihood[i]
  posterior: number[]         // prior[i] * likelihood[i] / marginalLikelihood
  kl: number                  // Σ posterior[i] * log(posterior[i] / prior[i])
  surprisal: number           // -log(marginalLikelihood)
  R: number                   // E_posterior[-log(likelihood)]
```

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Bayesian Belief Update                          [bits ▼] [nats]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PRIOR p(z)         LIKELIHOOD p(ŭ|z)      POSTERIOR p(z|ŭ)   │
│   ┌─────────┐        ┌─────────┐            ┌─────────┐        │
│ z1│████░░░░░│      z1│██████░░░│          z1│██░░░░░░░│        │
│ z2│██░░░░░░░│      z2│█░░░░░░░░│          z2│█░░░░░░░░│        │
│ z3│███░░░░░░│      z3│████████░│          z3│███████░░│        │
│ z4│███░░░░░░│      z4│███░░░░░░│          z4│██░░░░░░░│        │
│   └─────────┘        └─────────┘            └─────────┘        │
│   [editable]         [editable]             [computed]         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  SURPRISAL DECOMPOSITION                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │███████████████████████████│░░░░░░░░░░░░░│                │  │
│  │         KL                │      R      │                │  │
│  └──────────────────────────────────────────────────────────┘  │
│  surprisal(ŭ) = 2.34 bits  =  KL: 1.87 bits  +  R: 0.47 bits   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  EQUATION                                                       │
│  [rendered KaTeX of the full decomposition equation]            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Interactions

### Editing Distributions

**Option A — Draggable bars**: Click and drag bar endpoints horizontally to change values. Prior auto-normalizes to sum to 1. Likelihood values independent (each in [0,1]).

**Option B — Numeric inputs**: Small input fields next to each bar. More precise, less playful.

**Option C — Both**: Bars are draggable, with numeric values shown that can also be typed.

**Recommendation**: Option A (draggable) with values displayed on hover or beside bars. Option C if precision matters for your use case.

**Question**: How important is precise numeric input vs. playful exploration?

### Other Controls

- **Log base toggle**: Switch between bits (log₂) and nats (ln)
- **Reset button**: Return to default distributions
- **Preset scenarios**: Optional — predefined interesting cases (uniform prior, peaked likelihood, etc.)
- **Support size**: Could allow adding/removing states. Or fix at 4-5 for simplicity.

**Question**: Fixed support size, or dynamic?

## Visual Design

### Color Scheme

- Prior: Blue tones
- Likelihood: Orange/amber tones
- Posterior: Purple/violet (conceptually: blue + orange mixing)
- KL portion of surprisal bar: Purple (matches posterior)
- R portion: A neutral or complementary color

### Bar Chart Details

- Horizontal bars (probability on x-axis, support labels on y-axis)
- Scale: 0 to 1 for all charts
- Grid lines at 0.25, 0.5, 0.75
- Values displayed at bar ends or on hover

## Open Questions

1. **Framework preference?** Svelte vs vanilla JS vs other?
2. **Interaction style?** Draggable bars vs numeric inputs vs both?
3. **Fixed or dynamic support size?** Start with 4 states? Allow adding more?
4. **Presets?** Include example scenarios to demonstrate concepts?
5. **Equation display**: Always visible, or collapsible/toggleable?
6. **Any additional diagnostics?** Entropy of prior/posterior? Mutual information framing?

## Implementation Phases

### Phase 1: Static Scaffold
- Set up project (Vite + Svelte or vanilla)
- Render three static bar charts with mock data
- Render KaTeX equation
- Basic layout/styling

### Phase 2: Computation
- Implement Bayesian update math
- Implement KL, surprisal, R calculations
- Wire derived values to display

### Phase 3: Interactivity
- Make prior bars draggable (with normalization)
- Make likelihood bars draggable
- Reactive updates to posterior and diagnostics

### Phase 4: Polish
- Surprisal decomposition bar visualization
- Bits/nats toggle
- Styling refinements
- Presets (if desired)
