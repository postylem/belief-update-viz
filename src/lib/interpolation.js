/**
 * Monotone cubic interpolation (Fritsch-Carlson method)
 * Guarantees monotonicity between control points, which preserves
 * non-negativity when all control point values are ≥ 0.
 */

/**
 * Interpolate control points onto evaluation points using monotone cubic splines.
 * @param {number[]} xs - Control point x-coordinates (must be sorted ascending)
 * @param {number[]} ys - Control point y-values
 * @param {number[]} evalXs - X-coordinates to evaluate at
 * @returns {number[]} Interpolated y-values at evalXs
 */
export function interpolateMonotone(xs, ys, evalXs) {
  const n = xs.length;
  if (n === 0) return evalXs.map(() => 0);
  if (n === 1) return evalXs.map(() => ys[0]);

  // Step 1: Compute secants
  const deltas = Array(n - 1);
  const h = Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    h[i] = xs[i + 1] - xs[i];
    deltas[i] = (ys[i + 1] - ys[i]) / h[i];
  }

  // Step 2: Initialize tangents
  const m = Array(n);
  m[0] = deltas[0];
  m[n - 1] = deltas[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (deltas[i - 1] * deltas[i] <= 0) {
      m[i] = 0;
    } else {
      m[i] = (deltas[i - 1] + deltas[i]) / 2;
    }
  }

  // Step 3: Fritsch-Carlson adjustment for monotonicity
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(deltas[i]) < 1e-30) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const alpha = m[i] / deltas[i];
      const beta = m[i + 1] / deltas[i];
      const tau = alpha * alpha + beta * beta;
      if (tau > 9) {
        const s = 3 / Math.sqrt(tau);
        m[i] = s * alpha * deltas[i];
        m[i + 1] = s * beta * deltas[i];
      }
    }
  }

  // Step 4: Evaluate using Hermite basis functions
  return evalXs.map(x => {
    // Clamp to domain
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];

    // Binary search for interval
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] <= x) lo = mid;
      else hi = mid;
    }

    const dx = xs[hi] - xs[lo];
    const t = (x - xs[lo]) / dx;
    const t2 = t * t;
    const t3 = t2 * t;

    // Hermite basis
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    return h00 * ys[lo] + h10 * dx * m[lo] + h01 * ys[hi] + h11 * dx * m[hi];
  });
}
