import { Variation } from "@/src/types/Variations/Variation";
import { CurveVariation } from "@/src/types/Variations/CurveVariation";
import { PeriodicVariation } from "@/src/types/Variations/PeriodicVariation";
import { AudioVariation } from "@/src/types/Variations/AudioVariation";
import { fitCurveNodes } from "@/src/utils/migrateVariations";
import { isVector4 } from "@/src/utils/object";
import { isPalette } from "@/src/params/palette/Palette";
import type { Store } from "@/src/types/Store";
import type { PatternParam } from "@/src/params/shared/patternParam";

// Scalar region modes — the only ones that are inter-convertible.
export type RegionType = "curve" | "lfo" | "audio";
// Everything that can be INSERTED into a lane, gated by the param's value type.
export type InsertType = RegionType | "palette" | "color";

// Which region types make sense for a param, by its value type: numeric → the
// scalar modes; a Palette param → palette regions; a vec4 (color) param → color
// regions. Anything else (texture/null) → none.
export const allowedInsertTypes = (param?: PatternParam): InsertType[] => {
  const val = param?.value;
  if (isPalette(val)) return ["palette"];
  if (isVector4(val)) return ["color"];
  if (typeof val === "number") return ["curve", "lfo", "audio"];
  return [];
};

/** The region mode of a variation, or "other" for non-scalar (color) types. */
export const regionTypeOf = (v: Variation): RegionType | "other" =>
  v instanceof CurveVariation
    ? "curve"
    : v instanceof PeriodicVariation
      ? "lfo"
      : v instanceof AudioVariation
        ? "audio"
        : "other";

/**
 * Convert a region to another mode IN PLACE (the caller keeps the duration).
 * Never a silent bake:
 * - → Curve: sample-to-nodes — a sparse editable sketch (loose adaptive fit of
 *   the current output), not a dense trace.
 * - → LFO: start-fresh sine seeded from the region's output — amplitude from the
 *   value range, center (offset) from the mean.
 * - → Audio: start-fresh seeded from the range (factor spans it, offset = min).
 */
export const convertRegion = (
  v: Variation,
  target: RegionType,
  store: Store,
  param: PatternParam | undefined,
  globalStart: number,
): Variation => {
  const dur = v.duration;
  const at = (t: number) => v.valueAtTime(t, globalStart + t) as number;

  if (target === "curve") {
    const nodes = fitCurveNodes((t) => at(t), dur, {
      relTol: 0.04,
      maxNodes: 16,
      denseSamples: 120,
    });
    return new CurveVariation(dur, nodes);
  }

  // seed generators from the region's output range (fall back to the param's
  // declared range, then [0,1], when the source is flat)
  let [lo, hi] = v.computeDomain();
  if (!(hi - lo > 1e-6)) {
    lo = typeof param?.min === "number" ? param.min : 0;
    hi = typeof param?.max === "number" ? param.max : 1;
  }

  if (target === "lfo") {
    const N = 24;
    let sum = 0;
    for (let i = 0; i <= N; i++) sum += at((i / N) * dur);
    const mean = sum / (N + 1);
    const amplitude = (hi - lo) / 2 || 0.5;
    const period = Math.min(dur, 1) || 1; // one cycle for short regions, else 1s
    return new PeriodicVariation(dur, "sine", amplitude, period, 0, mean);
  }

  // audio
  return new AudioVariation(dur, hi - lo || 1, lo, 0, store);
};
