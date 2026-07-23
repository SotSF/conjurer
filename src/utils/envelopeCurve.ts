/**
 * Per-segment curvature ("tension") shaping for the continuous-parameter
 * envelope editor (the Ableton-style automation lane that replaces the discrete
 * flat/linear/easing/spline variation types).
 *
 * A Curve segment between two nodes carries a single scalar `tension` in
 * [-1, 1]; 0 is linear. Positive tension eases in (slow start, fast finish);
 * negative eases out (fast start, slow finish). Endpoints are always fixed:
 * `applyTension(0, c) === 0` and `applyTension(1, c) === 1` for every `c`.
 *
 * The shape is a symmetric power curve: `value = u ^ (2 ^ (c * MAX))`. It is
 * monotone for all `c`, so a single scalar covers a straight line plus every
 * monotone ease. Non-monotone eases (elastic/bounce/back) overshoot and cannot
 * be a tension — those stay named "preset segments" and are shaped elsewhere.
 * The frame-time lookup is a single `Math.pow`, cheap enough for the render loop.
 */

/**
 * Exponent magnitude at |tension| === 1. At tension 1 the curve is `u ^ 16`;
 * at tension -1 it is `u ^ (1 / 16)`.
 */
export const MAX_TENSION_EXPONENT = 4;

const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const clampTension = (c: number) => (c < -1 ? -1 : c > 1 ? 1 : c);

/**
 * Shape a normalized progress `u` in [0, 1] by `tension` in [-1, 1], returning
 * the eased progress in [0, 1]. `tension === 0` is the identity (linear).
 */
export const applyTension = (u: number, tension: number): number => {
  const clampedU = clamp01(u);
  if (tension === 0) return clampedU;
  const exponent = Math.pow(2, clampTension(tension) * MAX_TENSION_EXPONENT);
  return Math.pow(clampedU, exponent);
};

/**
 * Value of a tension-shaped Curve segment from `from` to `to` at normalized
 * progress `u`.
 */
export const tensionSegmentValue = (
  from: number,
  to: number,
  u: number,
  tension: number,
): number => from + (to - from) * applyTension(u, tension);

/**
 * Cubic Hermite (bezier-equivalent) basis functions for a segment parameterized
 * by `u` in [0, 1]. h00/h01 weight the endpoint values; h10/h11 weight the
 * endpoint tangents. Exported so the migration fitter can least-squares-solve
 * the tangents.
 */
export const h00 = (u: number) => 2 * u ** 3 - 3 * u * u + 1;
export const h10 = (u: number) => u ** 3 - 2 * u * u + u;
export const h01 = (u: number) => -2 * u ** 3 + 3 * u * u;
export const h11 = (u: number) => u ** 3 - u * u;

/**
 * Value of a cubic Hermite (bezier) segment from `from` to `to` across a segment
 * of duration `dt`, with endpoint tangents given as slopes (value per unit
 * time): `tangentOut` leaves `from`, `tangentIn` arrives at `to`. `u` in [0, 1].
 *
 * Zero tangents give a flat hold when from === to (a constant), and the line
 * slope `(to - from) / dt` gives an exact straight segment — so flat and linear
 * both fall out of the same primitive, and one segment can carry an S/inflection
 * (which a single monotone tension cannot).
 */
export const hermiteSegmentValue = (
  from: number,
  to: number,
  tangentOut: number,
  tangentIn: number,
  dt: number,
  u: number,
): number =>
  h00(u) * from +
  h10(u) * (tangentOut * dt) +
  h01(u) * to +
  h11(u) * (tangentIn * dt);

/** Scalar cubic Bézier at parameter s in [0,1] with control coords a,b,c,d. */
export const evalCubic = (a: number, b: number, c: number, d: number, s: number) => {
  const t = 1 - s;
  return t * t * t * a + 3 * t * t * s * b + 3 * t * s * s * c + s * s * s * d;
};

/**
 * Solve X(s)=x for s in [0,1] on a cubic-Bézier x-track with control coords
 * p0x…p3x, assumed monotonic non-decreasing (the editor clamps handles so).
 * Bisection → single-valued, ~2^-26 precision.
 */
export const solveBezierS = (
  p0x: number,
  p1x: number,
  p2x: number,
  p3x: number,
  x: number,
): number => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2;
    if (evalCubic(p0x, p1x, p2x, p3x, mid) < x) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

/**
 * Value of a parametric cubic-Bézier segment at time `x`. The segment's four
 * control points are (p0x,p0v)…(p3x,p3v). Solves X(s)=x, then returns Y(s).
 * This is the CSS-easing-style evaluate that lets a handle's horizontal length
 * shape the curve (the extra degree of freedom a Hermite tangent can't carry).
 */
export const bezierValueAtX = (
  p0x: number,
  p0v: number,
  p1x: number,
  p1v: number,
  p2x: number,
  p2v: number,
  p3x: number,
  p3v: number,
  x: number,
): number => {
  const s = solveBezierS(p0x, p1x, p2x, p3x, x);
  return evalCubic(p0v, p1v, p2v, p3v, s);
};
