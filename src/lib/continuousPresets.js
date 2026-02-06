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
    name: 'Truncated Normal',
    family: 'truncnorm',
    defaultParams: { mu: 0.5, sigma: 0.15 },
    paramDefs: [
      { name: 'mu', labelTex: '\\mu', min: 0, max: 1, step: 0.01, default: 0.5 },
      { name: 'sigma', labelTex: '\\sigma', min: 0.02, max: 0.4, step: 0.01, default: 0.15 },
    ],
    generator: (n, params, domain) =>
      generateControlPoints(n, domain, x => gaussianPDF(x, params.mu, params.sigma)),
  },
  {
    name: 'Beta',
    family: 'beta',
    defaultParams: { alpha: 2, beta: 5 },
    paramDefs: [
      { name: 'alpha', labelTex: '\\alpha', min: 0.5, max: 20, step: 0.1, default: 2 },
      { name: 'beta', labelTex: '\\beta', min: 0.5, max: 20, step: 0.1, default: 5 },
    ],
    generator: (n, params, domain) =>
      generateControlPoints(n, domain, x => betaPDF(x, params.alpha, params.beta)),
  },
  {
    name: 'Bimodal',
    family: 'bimodal',
    defaultParams: { mu1: 0.3, mu2: 0.7, sigma: 0.08, weight: 0.5 },
    paramDefs: [
      { name: 'mu1', labelTex: '\\mu_1', min: 0, max: 1, step: 0.01, default: 0.3 },
      { name: 'mu2', labelTex: '\\mu_2', min: 0, max: 1, step: 0.01, default: 0.7 },
      { name: 'sigma', labelTex: '\\sigma', min: 0.02, max: 0.2, step: 0.01, default: 0.08 },
      { name: 'weight', labelTex: 'w', min: 0, max: 1, step: 0.01, default: 0.5 },
    ],
    generator: (n, params, domain) =>
      generateControlPoints(n, domain, x => bimodalPDF(x, params.mu1, params.mu2, params.sigma, params.weight)),
  },
];

// ---- Likelihood presets ----

export const likelihoodPresets = [
  {
    name: 'Flat',
    family: 'uniform',
    defaultParams: { level: 0.5 },
    paramDefs: [
      { name: 'level', labelTex: 'c', min: 0.01, max: 1, step: 0.01, default: 0.5 },
    ],
    generator: (n, params, _domain) =>
      Array(n).fill(params.level),
  },
  {
    name: 'One peak',
    family: 'onepeak',
    defaultParams: { center: 0.5, width: 0.1 },
    paramDefs: [
      { name: 'center', labelTex: 'c', min: 0, max: 1, step: 0.01, default: 0.5 },
      { name: 'width', labelTex: 'w', min: 0.02, max: 0.4, step: 0.01, default: 0.1 },
    ],
    generator: (n, params, domain) => {
      const [a, b] = domain;
      const xs = Array.from({ length: n }, (_, i) => a + (i / (n - 1)) * (b - a));
      return xs.map(x => Math.exp(-0.5 * ((x - params.center) / params.width) ** 2));
    },
  },
  {
    name: 'Window',
    family: 'window',
    defaultParams: { a: 0.3, b: 0.7, high: 0.9, low: 0.1 },
    paramDefs: [
      { name: 'a', labelTex: 'a', min: 0, max: 1, step: 0.01, default: 0.3 },
      { name: 'b', labelTex: 'b', min: 0, max: 1, step: 0.01, default: 0.7 },
      { name: 'high', labelTex: 'h', min: 0.01, max: 1, step: 0.01, default: 0.9 },
      { name: 'low', labelTex: '\\ell', min: 0.01, max: 1, step: 0.01, default: 0.1 },
    ],
    generator: (n, params, domain) => {
      const [domLo, domHi] = domain;
      const lo = Math.min(params.a, params.b);
      const hi = Math.max(params.a, params.b);
      return Array.from({ length: n }, (_, i) => {
        const x = domLo + (i / (n - 1)) * (domHi - domLo);
        return (x >= lo && x <= hi) ? params.high : params.low;
      });
    },
  },
  {
    name: 'Ramp',
    family: 'ramp',
    defaultParams: { left: 0.1, right: 0.9 },
    paramDefs: [
      { name: 'left', labelTex: 'a', min: 0.01, max: 1, step: 0.01, default: 0.1 },
      { name: 'right', labelTex: 'b', min: 0.01, max: 1, step: 0.01, default: 0.9 },
    ],
    generator: (n, params, _domain) =>
      Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        return params.left + t * (params.right - params.left);
      }),
  },
  {
    name: 'Two peaks',
    family: 'twopeaks',
    defaultParams: { c1: 0.3, c2: 0.7, width: 0.08, weight: 0.5 },
    paramDefs: [
      { name: 'c1', labelTex: 'c_1', min: 0, max: 1, step: 0.01, default: 0.3 },
      { name: 'c2', labelTex: 'c_2', min: 0, max: 1, step: 0.01, default: 0.7 },
      { name: 'width', labelTex: 'w', min: 0.02, max: 0.2, step: 0.01, default: 0.08 },
      { name: 'weight', labelTex: 'p', min: 0, max: 1, step: 0.01, default: 0.5 },
    ],
    generator: (n, params, domain) => {
      const [a, b] = domain;
      const xs = Array.from({ length: n }, (_, i) => a + (i / (n - 1)) * (b - a));
      const raw = xs.map(x =>
        params.weight * Math.exp(-0.5 * ((x - params.c1) / params.width) ** 2) +
        (1 - params.weight) * Math.exp(-0.5 * ((x - params.c2) / params.width) ** 2)
      );
      const maxVal = Math.max(...raw);
      return maxVal > 0 ? raw.map(v => v / maxVal) : raw;
    },
  },
];
