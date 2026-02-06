/**
 * Parametric PDF generators for continuous distributions.
 * Each preset provides parameter definitions and a generator that produces
 * control point y-values for a given number of points and domain.
 */

// ---- PDF functions ----

function gaussianPDF(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

function betaPDF(x, alpha, beta) {
  if (x <= 0 || x >= 1) return 0;
  const logB = lnGamma(alpha) + lnGamma(beta) - lnGamma(alpha + beta);
  return Math.exp((alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - logB);
}

/** Log-gamma via Lanczos approximation */
function lnGamma(z) {
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
  }
  z -= 1;
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function uniformPDF(x, a, b) {
  return (x >= a && x <= b) ? 1 / (b - a) : 0;
}

function bimodalPDF(x, mu1, mu2, sigma, weight) {
  return weight * gaussianPDF(x, mu1, sigma) + (1 - weight) * gaussianPDF(x, mu2, sigma);
}

function peakedPDF(x, center, sharpness) {
  // Using a Beta-like shape centered on `center` with concentration `sharpness`
  const alpha = center * sharpness;
  const beta = (1 - center) * sharpness;
  if (alpha < 0.5 || beta < 0.5) return gaussianPDF(x, center, 0.05);
  return betaPDF(x, alpha, beta);
}

// ---- Preset generator helper ----

function generateControlPoints(nPoints, domain, pdfFn) {
  const [a, b] = domain;
  const xs = Array.from({ length: nPoints }, (_, i) => a + (i / (nPoints - 1)) * (b - a));
  return xs.map(x => Math.max(0, pdfFn(x)));
}

// ---- Prior presets ----

export const priorPresets = [
  {
    name: 'Uniform',
    family: 'uniform',
    defaultParams: {},
    paramDefs: [],
    generator: (n, _params, domain) =>
      generateControlPoints(n, domain, x => uniformPDF(x, domain[0], domain[1])),
  },
  {
    name: 'Gaussian',
    family: 'gaussian',
    defaultParams: { mu: 0.5, sigma: 0.15 },
    paramDefs: [
      { name: 'mu', label: 'Mean (μ)', min: 0, max: 1, step: 0.01, default: 0.5 },
      { name: 'sigma', label: 'Std dev (σ)', min: 0.02, max: 0.4, step: 0.01, default: 0.15 },
    ],
    generator: (n, params, domain) =>
      generateControlPoints(n, domain, x => gaussianPDF(x, params.mu, params.sigma)),
  },
  {
    name: 'Beta',
    family: 'beta',
    defaultParams: { alpha: 2, beta: 5 },
    paramDefs: [
      { name: 'alpha', label: 'Alpha (α)', min: 0.5, max: 20, step: 0.1, default: 2 },
      { name: 'beta', label: 'Beta (β)', min: 0.5, max: 20, step: 0.1, default: 5 },
    ],
    generator: (n, params, domain) =>
      generateControlPoints(n, domain, x => betaPDF(x, params.alpha, params.beta)),
  },
  {
    name: 'Bimodal',
    family: 'bimodal',
    defaultParams: { mu1: 0.3, mu2: 0.7, sigma: 0.08, weight: 0.5 },
    paramDefs: [
      { name: 'mu1', label: 'Mode 1 (μ₁)', min: 0, max: 1, step: 0.01, default: 0.3 },
      { name: 'mu2', label: 'Mode 2 (μ₂)', min: 0, max: 1, step: 0.01, default: 0.7 },
      { name: 'sigma', label: 'Std dev (σ)', min: 0.02, max: 0.2, step: 0.01, default: 0.08 },
      { name: 'weight', label: 'Weight (w)', min: 0, max: 1, step: 0.01, default: 0.5 },
    ],
    generator: (n, params, domain) =>
      generateControlPoints(n, domain, x => bimodalPDF(x, params.mu1, params.mu2, params.sigma, params.weight)),
  },
  {
    name: 'Peaked',
    family: 'peaked',
    defaultParams: { center: 0.5, sharpness: 20 },
    paramDefs: [
      { name: 'center', label: 'Center', min: 0.05, max: 0.95, step: 0.01, default: 0.5 },
      { name: 'sharpness', label: 'Sharpness', min: 2, max: 100, step: 1, default: 20 },
    ],
    generator: (n, params, domain) =>
      generateControlPoints(n, domain, x => peakedPDF(x, params.center, params.sharpness)),
  },
];

// ---- Likelihood presets ----

export const likelihoodPresets = [
  {
    name: 'Uniform',
    family: 'uniform',
    defaultParams: { level: 0.5 },
    paramDefs: [
      { name: 'level', label: 'Level', min: 0.01, max: 1, step: 0.01, default: 0.5 },
    ],
    generator: (n, params, _domain) =>
      Array(n).fill(params.level),
  },
  {
    name: 'Gaussian',
    family: 'gaussian',
    defaultParams: { mu: 0.5, sigma: 0.1 },
    paramDefs: [
      { name: 'mu', label: 'Peak (μ)', min: 0, max: 1, step: 0.01, default: 0.5 },
      { name: 'sigma', label: 'Width (σ)', min: 0.02, max: 0.4, step: 0.01, default: 0.1 },
    ],
    generator: (n, params, domain) => {
      const [a, b] = domain;
      const xs = Array.from({ length: n }, (_, i) => a + (i / (n - 1)) * (b - a));
      // Normalize so peak = 1
      return xs.map(x => Math.exp(-0.5 * ((x - params.mu) / params.sigma) ** 2));
    },
  },
  {
    name: 'Step',
    family: 'step',
    defaultParams: { cutoff: 0.5, high: 0.9, low: 0.1 },
    paramDefs: [
      { name: 'cutoff', label: 'Cutoff', min: 0, max: 1, step: 0.01, default: 0.5 },
      { name: 'high', label: 'High', min: 0.01, max: 1, step: 0.01, default: 0.9 },
      { name: 'low', label: 'Low', min: 0.01, max: 1, step: 0.01, default: 0.1 },
    ],
    generator: (n, params, domain) => {
      const [a, b] = domain;
      return Array.from({ length: n }, (_, i) => {
        const x = a + (i / (n - 1)) * (b - a);
        return x < params.cutoff ? params.high : params.low;
      });
    },
  },
  {
    name: 'Linear',
    family: 'linear',
    defaultParams: { left: 0.1, right: 0.9 },
    paramDefs: [
      { name: 'left', label: 'Left', min: 0.01, max: 1, step: 0.01, default: 0.1 },
      { name: 'right', label: 'Right', min: 0.01, max: 1, step: 0.01, default: 0.9 },
    ],
    generator: (n, params, _domain) =>
      Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        return params.left + t * (params.right - params.left);
      }),
  },
  {
    name: 'Peaked',
    family: 'peaked',
    defaultParams: { center: 0.5, sharpness: 30 },
    paramDefs: [
      { name: 'center', label: 'Center', min: 0, max: 1, step: 0.01, default: 0.5 },
      { name: 'sharpness', label: 'Sharpness', min: 1, max: 100, step: 1, default: 30 },
    ],
    generator: (n, params, domain) => {
      const [a, b] = domain;
      return Array.from({ length: n }, (_, i) => {
        const x = a + (i / (n - 1)) * (b - a);
        return Math.exp(-params.sharpness * (x - params.center) ** 2);
      });
    },
  },
];
