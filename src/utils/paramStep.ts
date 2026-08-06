import { Block } from "@/src/types/Block";
import { defaultPatternEffectMap } from "@/src/utils/patternsEffects";

/** Matches the default step used by number/boolean parameter controls. */
export const DEFAULT_PARAM_STEP = 0.01;

/**
 * Quantize `value` onto a step grid (kills float drift like 0.1+0.2).
 * When min/max are given, the result stays on-grid inside that range (never
 * clamped onto an off-step bound).
 */
export const snapValueToStep = (
  value: number,
  step: number,
  min?: number,
  max?: number,
) => {
  if (!(step > 0) || !Number.isFinite(value)) return value;
  const precision = Math.max(0, Math.ceil(-Math.log10(step) - 1e-12));
  const fix = (n: number) => Number(n.toFixed(precision));
  let snapped = fix(Math.round(value / step) * step);
  if (typeof min === "number" && Number.isFinite(min) && snapped < min)
    snapped = fix(Math.ceil(min / step - 1e-12) * step);
  if (typeof max === "number" && Number.isFinite(max) && snapped > max)
    snapped = fix(Math.floor(max / step + 1e-12) * step);
  return snapped;
};

/**
 * Resolve a param's step from the live block, then the catalog pattern
 * definition, then {@link DEFAULT_PARAM_STEP}.
 */
export const resolveParamStep = (block: Block, uniformName: string) => {
  const live = block.pattern.params[uniformName];
  if (typeof live?.step === "number" && live.step > 0) return live.step;
  const catalog =
    defaultPatternEffectMap[block.pattern.name]?.params[uniformName];
  if (typeof catalog?.step === "number" && catalog.step > 0) return catalog.step;
  return DEFAULT_PARAM_STEP;
};

/** True when the live or catalog param declares an explicit positive step. */
export const paramHasExplicitStep = (block: Block, uniformName: string) => {
  const live = block.pattern.params[uniformName];
  if (typeof live?.step === "number" && live.step > 0) return true;
  const catalog =
    defaultPatternEffectMap[block.pattern.name]?.params[uniformName];
  return typeof catalog?.step === "number" && catalog.step > 0;
};
