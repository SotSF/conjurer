import { Variation } from "@/src/types/Variations/Variation";
import { CurveVariation } from "@/src/types/Variations/CurveVariation";
import { PeriodicVariation } from "@/src/types/Variations/PeriodicVariation";
import { AudioVariation } from "@/src/types/Variations/AudioVariation";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { PaletteVariation } from "@/src/params/palette/variation/PaletteVariation";
import { fitCurveNodes } from "@/src/utils/migrateVariations";
import { isVector4 } from "@/src/utils/object";
import { isPalette } from "@/src/params/palette/Palette";
import { Vector4 } from "three";
import type { Store } from "@/src/types/Store";
import type { PatternParam } from "@/src/params/shared/patternParam";
import { DEFAULT_PERIOD } from "@/src/utils/time";

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

/**
 * Build a fresh region of `type` to drop into a lane. `seamValue` is the lane's
 * current value where the region lands (from `laneValueAt`), so a new Curve
 * starts flat at the value it replaces — the seam stays continuous. Generators
 * seed from the param's declared range instead, since they sweep it.
 */
export const makeRegionOfType = (
  type: InsertType,
  duration: number,
  seamValue: unknown,
  param: PatternParam | undefined,
  store: Store,
): Variation => {
  if (type === "palette") {
    const palette = isPalette(seamValue) ? seamValue : param?.value;
    return new PaletteVariation(duration, palette as never);
  }
  if (type === "color") {
    const color = isVector4(seamValue)
      ? seamValue
      : isVector4(param?.value)
        ? param!.value
        : new Vector4(1, 1, 1, 1);
    return new LinearVariation4(duration, color, color);
  }

  const lo = typeof param?.min === "number" ? param.min : 0;
  const hi = typeof param?.max === "number" ? param.max : 1;
  if (type === "lfo")
    return new PeriodicVariation(
      duration,
      "sine",
      (hi - lo) / 2,
      Math.min(DEFAULT_PERIOD, duration) || DEFAULT_PERIOD,
      0,
      (hi + lo) / 2,
    );
  if (type === "audio")
    return new AudioVariation(duration, hi - lo || 1, lo, 0, store);

  return CurveVariation.flat(
    duration,
    typeof seamValue === "number" ? seamValue : lo,
  );
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
    // one cycle for short regions, else DEFAULT_PERIOD
    const period = Math.min(dur, DEFAULT_PERIOD) || DEFAULT_PERIOD;
    return new PeriodicVariation(dur, "sine", amplitude, period, 0, mean);
  }

  // audio
  return new AudioVariation(dur, hi - lo || 1, lo, 0, store);
};
