/**
 * Preset distribution generators
 *
 * For priors: values will be normalized after generation
 * For likelihoods: values are raw probabilities in [0, 1]
 */

import { normalize } from './math.js';

/**
 * Generate uniform distribution (equal values)
 * @param {number} n - Number of states
 * @returns {number[]} - Array of equal values (1/n each)
 */
export function uniform(n) {
  return Array(n).fill(1 / n);
}

/**
 * Generate uniform likelihood (all 1s - every state equally likely to produce observation)
 * @param {number} n - Number of states
 * @returns {number[]} - Array of 1s
 */
export function uniformLikelihood(n) {
  return Array(n).fill(1);
}

/**
 * Generate random values sampled from U[0,1], then normalized
 * Good for generating random priors
 * @param {number} n - Number of states
 * @returns {number[]} - Array of random values summing to 1
 */
export function iidUniform(n) {
  const values = Array(n).fill(0).map(() => Math.random());
  return normalize(values);
}

/**
 * Generate random likelihood values sampled from U[0,1]
 * @param {number} n - Number of states
 * @returns {number[]} - Array of random values in [0,1]
 */
export function iidUniformLikelihood(n) {
  return Array(n).fill(0).map(() => Math.random());
}

/**
 * Generate random values sampled from log-uniform distribution on [epsilon, 1]
 * This gives more weight to small values, useful for exploring low-probability states
 * @param {number} n - Number of states
 * @param {number} epsilon - Minimum value (default 0.01)
 * @returns {number[]} - Array of log-uniform random values, normalized
 */
export function iidLogUniform(n, epsilon = 0.01) {
  const logEps = Math.log(epsilon);
  const values = Array(n).fill(0).map(() => {
    // Sample uniformly in log space between log(epsilon) and log(1)=0
    const logVal = logEps + Math.random() * (-logEps);
    return Math.exp(logVal);
  });
  return normalize(values);
}

/**
 * Generate random likelihood from log-uniform distribution
 * @param {number} n - Number of states
 * @param {number} epsilon - Minimum value (default 0.01)
 * @returns {number[]} - Array of log-uniform random values in [epsilon, 1]
 */
export function iidLogUniformLikelihood(n, epsilon = 0.01) {
  const logEps = Math.log(epsilon);
  return Array(n).fill(0).map(() => {
    const logVal = logEps + Math.random() * (-logEps);
    return Math.exp(logVal);
  });
}

/**
 * Generate binary (Bernoulli) values - each state is either 0 or 1
 * @param {number} n - Number of states
 * @param {number} p - Probability of 1 (default 0.5)
 * @returns {number[]} - Array of 0s and 1s, normalized (for prior)
 */
export function iidBernoulli(n, p = 0.5) {
  const values = Array(n).fill(0).map(() => Math.random() < p ? 1 : 0);
  // Ensure at least one non-zero value for valid prior
  if (values.every(v => v === 0)) {
    values[Math.floor(Math.random() * n)] = 1;
  }
  return normalize(values);
}

/**
 * Generate binary likelihood values
 * @param {number} n - Number of states
 * @param {number} p - Probability of 1 (default 0.5)
 * @returns {number[]} - Array of 0s and 1s
 */
export function iidBernoulliLikelihood(n, p = 0.5) {
  return Array(n).fill(0).map(() => Math.random() < p ? 1 : 0);
}

/**
 * Generate a "peaked" distribution - one state has most of the probability
 * @param {number} n - Number of states
 * @param {number} peakIndex - Which state to peak at (default: random)
 * @param {number} peakWeight - How much weight on the peak (default 0.8)
 * @returns {number[]} - Array with peaked distribution
 */
export function peaked(n, peakIndex = null, peakWeight = 0.8) {
  if (peakIndex === null) {
    peakIndex = Math.floor(Math.random() * n);
  }
  const values = Array(n).fill((1 - peakWeight) / (n - 1));
  values[peakIndex] = peakWeight;
  return values;
}

/**
 * Generate a "discriminating" likelihood - high for one state, low for others
 * @param {number} n - Number of states
 * @param {number} highIndex - Which state has high likelihood (default: random)
 * @param {number} highValue - Likelihood for high state (default 0.9)
 * @param {number} lowValue - Likelihood for other states (default 0.1)
 * @returns {number[]} - Discriminating likelihood array
 */
export function discriminatingLikelihood(n, highIndex = null, highValue = 0.9, lowValue = 0.1) {
  if (highIndex === null) {
    highIndex = Math.floor(Math.random() * n);
  }
  const values = Array(n).fill(lowValue);
  values[highIndex] = highValue;
  return values;
}

/**
 * All preset options for UI
 */
export const priorPresets = {
  uniform: { name: 'Uniform', generator: uniform },
  iidUniform: { name: 'Random (Uniform)', generator: iidUniform },
  iidLogUniform: { name: 'Random (Log-Uniform)', generator: iidLogUniform },
  iidBernoulli: { name: 'Random (Sparse)', generator: iidBernoulli },
  peaked: { name: 'Peaked', generator: peaked },
};

export const likelihoodPresets = {
  uniform: { name: 'Uniform (all 1)', generator: uniformLikelihood },
  iidUniform: { name: 'Random (Uniform)', generator: iidUniformLikelihood },
  iidLogUniform: { name: 'Random (Log-Uniform)', generator: iidLogUniformLikelihood },
  iidBernoulli: { name: 'Random (Sparse)', generator: iidBernoulliLikelihood },
  discriminating: { name: 'Discriminating', generator: discriminatingLikelihood },
};
