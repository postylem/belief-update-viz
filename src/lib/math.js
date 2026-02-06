/**
 * Core Bayesian computation functions
 * All computations work with arrays representing discrete distributions
 */

/**
 * Normalize an array to sum to 1
 * @param {number[]} arr - Array of non-negative values
 * @returns {number[]|null} - Normalized array, or null if sum is 0
 */
export function normalize(arr) {
  const sum = arr.reduce((a, b) => a + b, 0);
  if (sum === 0) return null;
  return arr.map(v => v / sum);
}

/**
 * Compute posterior distribution using Bayes' theorem
 * posterior ∝ prior * likelihood
 * @param {number[]} prior - Prior distribution (should sum to 1)
 * @param {number[]} likelihood - Likelihood values p(u|z) for each state
 * @returns {number[]|null} - Posterior distribution, or null if undefined
 */
export function computePosterior(prior, likelihood) {
  if (prior.length !== likelihood.length) {
    throw new Error('Prior and likelihood must have same length');
  }

  const unnormalized = prior.map((p, i) => p * likelihood[i]);
  return normalize(unnormalized);
}

/**
 * Compute marginal likelihood (evidence) E_prior[likelihood]
 * @param {number[]} prior - Prior distribution
 * @param {number[]} likelihood - Likelihood values
 * @returns {number} - Marginal likelihood
 */
export function computeMarginalLikelihood(prior, likelihood) {
  return prior.reduce((sum, p, i) => sum + p * likelihood[i], 0);
}

/**
 * Compute surprisal of the observation: -log E_prior[likelihood]
 * @param {number[]} prior - Prior distribution
 * @param {number[]} likelihood - Likelihood values
 * @param {number} logBase - Base for logarithm (2 for bits, Math.E for nats)
 * @returns {number} - Surprisal value
 */
export function computeSurprisal(prior, likelihood, logBase = 2) {
  const marginal = computeMarginalLikelihood(prior, likelihood);
  if (marginal === 0) return Infinity;
  return -Math.log(marginal) / Math.log(logBase);
}

/**
/**
 * Compute KL divergence D_KL(P || Q) = E_P[log(P/Q)]
 * @param {number[]} p - First distribution (as probabilities over same support)
 * @param {number[]} q - Second distribution (as probabilities over same support)
 * @param {number} logBase - Base for logarithm (2 for bits, Math.E for nats)
 * @returns {number} - KL divergence value
 */
export function computeKL(p, q, logBase = 2) {
  if (p === null) return NaN;
  if (p.some((p, i) => p > 0 && q[i] === 0)) return Infinity;

  const kl = p.reduce((acc, p, i) =>
    acc + (p > 0 ? p * Math.log(p / q[i]) : 0)
  , 0);
  return kl / Math.log(logBase);
}

/**
 * Compute R(u) = E_posterior[-log likelihood]
 * This is the expected surprisal of the likelihood under the posterior
 * @param {number[]} posterior - Posterior distribution
 * @param {number[]} likelihood - Likelihood values
 * @param {number} logBase - Base for logarithm (2 for bits, Math.E for nats)
 * @returns {number} - R value
 */
export function computeR(posterior, likelihood, logBase = 2) {
  if (posterior === null) return NaN;
  if (posterior.some((p, i) => p > 0 && likelihood[i] === 0)) return Infinity;

  const r = posterior.reduce((acc, p, i) =>
    acc + (p > 0 ? p * -Math.log(likelihood[i]) : 0)
  , 0);
  return r / Math.log(logBase);
}

/**
 * Compute all derived quantities at once
 * @param {number[]} prior - Prior distribution
 * @param {number[]} likelihood - Likelihood values
 * @param {number} logBase - Base for logarithm
 * @returns {object} - { posterior, kl, surprisal, r, marginalLikelihood }
 */
export function computeAll(prior, likelihood, logBase = 2) {
  const posterior = computePosterior(prior, likelihood);
  const marginalLikelihood = computeMarginalLikelihood(prior, likelihood);
  const surprisal = computeSurprisal(prior, likelihood, logBase);
  const kl = computeKL(posterior, prior, logBase);
  const r = computeR(posterior, likelihood, logBase);

  return {
    posterior,
    marginalLikelihood,
    surprisal,
    kl,
    r
  };
}

/**
 * Clamp a value to a range
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped value
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Format a number for display
 * @param {number} value - Value to format
 * @param {number} precision - Number of significant digits
 * @returns {string} - Formatted string
 */
export function formatNumber(value, precision = 3) {
  if (!Number.isFinite(value)) {
    return value > 0 ? '∞' : value < 0 ? '-∞' : 'undefined';
  }
  if (Math.abs(value) < 0.001 && value !== 0) {
    return value.toExponential(precision - 1);
  }
  return value.toPrecision(precision);
}
