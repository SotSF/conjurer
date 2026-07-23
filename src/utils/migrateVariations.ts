import { Variation } from "@/src/types/Variations/Variation";
import {
  CurveVariation,
  CurveNode,
  CurveHandle,
  makeCurveNode,
} from "@/src/types/Variations/CurveVariation";
import { SplineVariation } from "@/src/types/Variations/SplineVariation";
import { h00, h10, h01, h11 } from "@/src/utils/envelopeCurve";

/**
 * One-way migration from the old discrete variation model to the new
 * node + cubic-Bézier Curve. Each variation is fit INDEPENDENTLY into cubic
 * Hermite segments (tangents solved by closed-form least squares; splines seeded
 * at their control points → exact), then the fitted variations are stitched
 * along the lane. A step (coincident-time nodes) is inserted ONLY where two
 * adjacent variations genuinely differ in value at their shared boundary — never
 * guessed from samples — so a smooth wiggle is never shattered into false steps.
 */
export type FitOptions = {
  relTol?: number;
  maxNodes?: number;
  denseSamples?: number;
};

const DEFAULTS: Required<FitOptions> = {
  relTol: 0.01,
  maxNodes: 64,
  denseSamples: 200,
};

const DRAWN_TYPES = new Set(["flat", "linear", "easing", "spline"]);

// Closed-form least-squares fit of a cubic-Hermite segment's endpoint tangents
// (in the segment's local s-space) approximating valAt over [uA, uB].
const fitBezierSegment = (
  valAt: (u: number) => number,
  uA: number,
  uB: number,
) => {
  const va = valAt(uA);
  const vb = valAt(uB);
  const K = 25;
  let a11 = 0, a12 = 0, a22 = 0, b1 = 0, b2 = 0;
  const ss: number[] = [];
  const targets: number[] = [];
  for (let k = 1; k < K; k++) {
    const s = k / K;
    const target = valAt(uA + (uB - uA) * s);
    const r = target - h00(s) * va - h01(s) * vb;
    const p = h10(s);
    const q = h11(s);
    a11 += p * p;
    a12 += p * q;
    a22 += q * q;
    b1 += p * r;
    b2 += q * r;
    ss.push(s);
    targets.push(target);
  }
  const det = a11 * a22 - a12 * a12;
  let pA = 0, pB = 0;
  if (Math.abs(det) > 1e-12) {
    pA = (b1 * a22 - b2 * a12) / det;
    pB = (a11 * b2 - a12 * b1) / det;
  }
  let err = 0;
  let worstU = (uA + uB) / 2;
  for (let i = 0; i < ss.length; i++) {
    const s = ss[i];
    const h = h00(s) * va + h10(s) * pA + h01(s) * vb + h11(s) * pB;
    const e = Math.abs(h - targets[i]);
    if (e > err) {
      err = e;
      worstU = uA + (uB - uA) * s;
    }
  }
  return { pA, pB, err, worstU };
};

/**
 * Fit ONE continuous value function over [0, duration] into cubic-Hermite nodes.
 * `seedUs` (u-space, e.g. a spline's control points) are pre-placed; the fit
 * then adaptively subdivides at the point of maximum error until under tolerance.
 * No discontinuity detection — the caller guarantees the function is continuous
 * (a single variation), so this never produces steps.
 */
export const fitCurveNodes = (
  valueFn: (t: number) => number,
  duration: number,
  opts: FitOptions = {},
  seedUs?: number[],
): CurveNode[] => {
  const { relTol, maxNodes, denseSamples } = { ...DEFAULTS, ...opts };
  if (duration <= 0) return [makeCurveNode(0, valueFn(0))];

  const M = denseSamples;
  const vs: number[] = [];
  for (let i = 0; i <= M; i++) vs.push(valueFn((i / M) * duration));
  const span = Math.max(Math.max(...vs) - Math.min(...vs), 1e-9);
  const absTol = relTol * span;
  const valAt = (u: number) => valueFn(u * duration);

  let us = [0, 1];
  if (seedUs && seedUs.length) {
    const inside = seedUs.filter((s) => s > 1e-6 && s < 1 - 1e-6);
    us = Array.from(new Set([0, ...inside, 1])).sort((a, b) => a - b);
  }
  const solve = () => {
    const seg: { pA: number; pB: number; err: number; worstU: number }[] = [];
    let worst = { err: -1, u: 0 };
    for (let i = 0; i < us.length - 1; i++) {
      const f = fitBezierSegment(valAt, us[i], us[i + 1]);
      seg.push(f);
      if (f.err > worst.err) worst = { err: f.err, u: f.worstU };
    }
    return { seg, worst };
  };
  let r = solve();
  while (us.length < maxNodes && r.worst.err > absTol) {
    us.push(r.worst.u);
    us.sort((a, b) => a - b);
    r = solve();
  }

  // Hermite tangent coefficient pA (in local s-space) equals slope·dt, so the
  // equivalent Bézier control handle is exactly (dt/3, pA/3) — see the
  // Hermite↔Bézier identity in envelopeCurve.
  const acc: {
    u: number;
    value: number;
    handleIn: CurveHandle;
    handleOut: CurveHandle;
  }[] = us.map((u) => ({
    u,
    value: valAt(u),
    handleIn: { dt: 0, dv: 0 },
    handleOut: { dt: 0, dv: 0 },
  }));
  for (let i = 0; i < us.length - 1; i++) {
    const segTime = (us[i + 1] - us[i]) * duration;
    if (segTime > 0) {
      acc[i].handleOut = { dt: segTime / 3, dv: r.seg[i].pA / 3 };
      acc[i + 1].handleIn = { dt: -segTime / 3, dv: -r.seg[i].pB / 3 };
    }
  }
  return acc.map((n) =>
    makeCurveNode(n.u * duration, n.value, n.handleIn, n.handleOut),
  );
};

/**
 * Fit a single drawn variation into Curve nodes over its own [0, duration].
 * Splines are seeded at their control points (exact) and have their leading
 * NaN-clamp cleaned to hold the FIRST control-point value (the authored intent,
 * not the editor-corruption artifact). Everything else is fit adaptively.
 */
const fitVariationNodes = (v: Variation, opts: FitOptions): CurveNode[] => {
  const dur = v.duration || 0;
  if (v instanceof SplineVariation && v.points.length) {
    const xs = v.points.map((p) => p.x);
    const x0 = Math.min(...xs);
    const dMin = v.domainMin ?? 0;
    const dMax = v.domainMax ?? 1;
    const firstVal = dMin + v.points[0].y * (dMax - dMin);
    const valueFn = (t: number) => {
      const u = dur > 0 ? t / dur : 0;
      if (x0 > 0 && u < x0) return firstVal;
      return v.valueAtTime(t) as number;
    };
    return fitCurveNodes(valueFn, dur, opts, xs.filter((x) => x > 0 && x < 1));
  }
  return fitCurveNodes((t) => v.valueAtTime(t, 0) as number, dur, opts);
};

/**
 * Fit each variation in a (contiguous, drawn) run independently and stitch them
 * along one Curve. A step (coincident-time nodes) appears only where adjacent
 * variations differ at their shared boundary; otherwise the shared node merges
 * and the curve stays smooth.
 */
const foldRunToCurve = (
  variations: Variation[],
  runDuration: number,
  opts: FitOptions,
): CurveVariation => {
  if (variations.length === 0) return CurveVariation.flat(runDuration, 0);

  const perVar: CurveNode[][] = [];
  let acc = 0;
  for (const v of variations) {
    perVar.push(
      fitVariationNodes(v, opts).map((n) =>
        makeCurveNode(n.time + acc, n.value, n.handleIn, n.handleOut),
      ),
    );
    acc += v.duration || 0;
  }

  let min = Infinity, max = -Infinity;
  for (const vn of perVar)
    for (const n of vn) { min = Math.min(min, n.value); max = Math.max(max, n.value); }
  const eps = Math.max((max - min) * 0.005, 1e-9);

  const nodes: CurveNode[] = [];
  for (const vn of perVar) {
    if (vn.length === 0) continue;
    if (nodes.length === 0) {
      nodes.push(...vn);
      continue;
    }
    const prev = nodes[nodes.length - 1];
    const cur = vn[0];
    if (Math.abs(prev.value - cur.value) <= eps) {
      // continuous boundary → merge the shared node, carry the outgoing handle
      prev.handleOut = cur.handleOut;
      nodes.push(...vn.slice(1));
    } else {
      // genuine discontinuity → step (two coincident-time nodes)
      nodes.push(...vn);
    }
  }
  return new CurveVariation(runDuration, nodes);
};

// Clamp/extend a region list so durations sum to exactly blockDuration: truncate
// overrun (rule 1); if short, extend the trailing region to the block end
// (rule 3) — a Curve ending flat moves its final node to the new edge.
export const spanRegionsToBlock = (
  regions: Variation[],
  blockDuration: number,
  defaultValue: number,
): Variation[] => {
  const out: Variation[] = [];
  let acc = 0;
  for (const r of regions) {
    if (acc >= blockDuration - 1e-6) break;
    const remaining = blockDuration - acc;
    if ((r.duration || 0) > remaining) {
      r.duration = remaining;
      out.push(r);
      acc = blockDuration;
      break;
    }
    out.push(r);
    acc += r.duration || 0;
  }
  if (acc < blockDuration - 1e-6) {
    if (out.length) {
      const last = out[out.length - 1];
      last.duration += blockDuration - acc;
      if (last instanceof CurveVariation && last.nodes.length) {
        const n = last.nodes;
        const endsFlat =
          n.length === 1 ||
          Math.abs(n[n.length - 1].value - n[n.length - 2].value) < 1e-9;
        if (endsFlat) n[n.length - 1].time = last.duration;
      }
    } else {
      out.push(CurveVariation.flat(blockDuration, defaultValue));
    }
  }
  return out;
};

/** Fold a param's variation sequence into one full-block Curve (drawn only). */
export const sequenceToPreviewCurve = (
  variations: Variation[] | undefined,
  blockDuration: number,
  defaultValue: number,
  opts?: FitOptions,
): CurveVariation => {
  if (!variations || variations.length === 0)
    return CurveVariation.flat(blockDuration, defaultValue);
  const runDuration = variations.reduce((a, v) => a + (v.duration || 0), 0);
  const curve = foldRunToCurve(variations, runDuration, { ...opts });
  return spanRegionsToBlock([curve], blockDuration, defaultValue)[0] as CurveVariation;
};

/**
 * Migrate a param's sequence into a full-block REGION lane: contiguous drawn
 * variations fold into one Curve region; periodic → LFO and audio → Audio
 * regions are kept intact. Result is a Variation[] the timeline renders as
 * adjacent regions.
 */
export const migrateSequenceToRegions = (
  variations: Variation[] | undefined,
  blockDuration: number,
  defaultValue: number,
  opts?: FitOptions,
): Variation[] => {
  if (!variations || variations.length === 0)
    return [CurveVariation.flat(blockDuration, defaultValue)];

  const regions: Variation[] = [];
  let run: Variation[] = [];
  const flushRun = () => {
    if (run.length === 0) return;
    const runDuration = run.reduce((a, v) => a + (v.duration || 0), 0);
    regions.push(foldRunToCurve(run, runDuration, { ...opts }));
    run = [];
  };
  for (const v of variations) {
    if (DRAWN_TYPES.has(v.type)) run.push(v);
    else {
      flushRun();
      regions.push(v.clone());
    }
  }
  flushRun();

  return spanRegionsToBlock(regions, blockDuration, defaultValue);
};
