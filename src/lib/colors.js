/**
 * Color functions for the visualization
 *
 * Prior: Red hue, saturation varies with value
 * Likelihood: Blue hue, saturation varies with value
 * Posterior: Purple with hue varying based on log(prior)/log(likelihood) ratio
 */

// Base hues (in HSL degrees)
const PRIOR_HUE = 0;        // Red
const LIKELIHOOD_HUE = 220; // Blue
const POSTERIOR_HUE_MIN = 270; // Purple (more blue-influenced)
const POSTERIOR_HUE_MAX = 330; // Pink-purple (more red-influenced)

/**
 * Map a value [0,1] to saturation [minSat, maxSat]
 * Higher values = more saturated
 */
function valueSaturation(value, minSat = 20, maxSat = 85) {
  return minSat + value * (maxSat - minSat);
}

/**
 * Map a value [0,1] to lightness [maxLight, minLight]
 * Higher values = darker (lower lightness)
 */
function valueLightness(value, minLight = 40, maxLight = 85) {
  return maxLight - value * (maxLight - minLight);
}

/**
 * Generate color for prior distribution bar
 * @param {number} value - Prior probability value [0,1]
 * @returns {string} - HSL color string
 */
export function priorColor(value) {
  const sat = valueSaturation(value);
  const light = valueLightness(value);
  return `hsl(${PRIOR_HUE}, ${sat}%, ${light}%)`;
}

/**
 * Generate color for likelihood bar
 * @param {number} value - Likelihood value [0,1]
 * @returns {string} - HSL color string
 */
export function likelihoodColor(value) {
  const sat = valueSaturation(value);
  const light = valueLightness(value);
  return `hsl(${LIKELIHOOD_HUE}, ${sat}%, ${light}%)`;
}

/**
 * Generate color for posterior distribution bar
 * Hue varies based on the ratio of log contributions from prior vs likelihood
 *
 * @param {number} posteriorValue - Posterior probability value [0,1]
 * @param {number} priorValue - Prior probability value [0,1]
 * @param {number} likelihoodValue - Likelihood value [0,1]
 * @returns {string} - HSL color string
 */
export function posteriorColor(posteriorValue, priorValue, likelihoodValue) {
  // Compute log contributions (handle zeros carefully)
  const epsilon = 1e-10;
  const logPrior = Math.log(Math.max(priorValue, epsilon));
  const logLik = Math.log(Math.max(likelihoodValue, epsilon));

  // Ratio: what fraction of the log-posterior comes from the prior?
  // log(posterior) ∝ log(prior) + log(lik)
  // We want: priorContribution / (priorContribution + likContribution)
  // But logs are negative, so we use absolute values
  const absLogPrior = Math.abs(logPrior);
  const absLogLik = Math.abs(logLik);
  const total = absLogPrior + absLogLik;

  let priorRatio = 0.5; // Default to middle
  if (total > epsilon) {
    // Higher priorRatio means prior dominates
    priorRatio = absLogPrior / total;
  }

  // Map ratio to hue: more prior influence -> more red, more likelihood -> more blue
  // priorRatio high -> POSTERIOR_HUE_MAX (pink-red)
  // priorRatio low -> POSTERIOR_HUE_MIN (blue-purple)
  const hue = POSTERIOR_HUE_MIN + priorRatio * (POSTERIOR_HUE_MAX - POSTERIOR_HUE_MIN);

  const sat = valueSaturation(posteriorValue);
  const light = valueLightness(posteriorValue);

  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

/**
 * Fixed colors for KL and R in the surprisal bar
 */
export const KL_COLOR = 'hsl(155, 40%, 45%)';  // Blue-ish sage green
export const R_COLOR = 'hsl(25, 85%, 58%)';    // Red-ish orange

// Hex versions for KaTeX \color commands
export const KL_COLOR_HEX = '#45a085';  // Blue-ish sage green
export const R_COLOR_HEX = '#e87040';   // Red-ish orange

/**
 * Text colors that contrast well with backgrounds
 */
export const TEXT_LIGHT = '#ffffff';
export const TEXT_DARK = '#1a1a1a';

/**
 * Choose text color based on background lightness
 * @param {number} lightness - HSL lightness value
 * @returns {string} - Text color
 */
export function textColorForLightness(lightness) {
  return lightness > 55 ? TEXT_DARK : TEXT_LIGHT;
}
