import { runInAction } from "mobx";

import { Block } from "@/src/types/Block";
import { BASE_UNIFORMS } from "@/src/types/Pattern";
import { FlatVariation } from "@/src/types/Variations/FlatVariation";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { PaletteVariation } from "@/src/params/palette/variation/PaletteVariation";
import { DEFAULT_VARIATION_DURATION } from "@/src/utils/time";
import { isBooleanParam } from "@/src/params/boolean/isBooleanParam";
import { isNumberParam } from "@/src/params/number/isNumberParam";
import { isVector4Param } from "@/src/params/vector4/isVector4Param";
import { isPaletteParam } from "@/src/params/palette/isPaletteParam";

/** Matches the default step used by number/boolean parameter controls. */
const DEFAULT_STEP = 0.01;

/**
 * Picks a uniformly random value in `[min, max]` on the param's step grid.
 */
function randomSteppedNumber(min: number, max: number, step: number): number {
  if (!(step > 0) || !(max > min)) {
    return min;
  }
  const nSteps = Math.max(0, Math.round((max - min) / step));
  const index = Math.floor(Math.random() * (nSteps + 1));
  const raw = min + index * step;
  // Kill float drift (e.g. 0.1 + 0.2) the same way UI/MIDI snapping does.
  const snapped = Math.round(raw / step) * step;
  const precision = Math.max(0, Math.ceil(-Math.log10(step)));
  return Math.min(max, Math.max(min, Number(snapped.toFixed(precision))));
}

function setFlatVariation(block: Block, uniformName: string, value: number) {
  if (!block.parameterVariations[uniformName])
    block.parameterVariations[uniformName] = [];
  block.parameterVariations[uniformName]![0] = new FlatVariation(
    DEFAULT_VARIATION_DURATION,
    value,
  );
}

function randomizeParams(block: Block): void {
  for (const [uniformName, param] of Object.entries(block.pattern.params)) {
    if (BASE_UNIFORMS.includes(uniformName)) continue;

    if (isBooleanParam(param)) {
      const value = Math.random() < 0.5 ? 0 : 1;
      param.value = value;
      setFlatVariation(block, uniformName, value);
    } else if (isNumberParam(param)) {
      const min = typeof param.min === "number" ? param.min : 0;
      const max = typeof param.max === "number" ? param.max : 1;
      const step =
        typeof param.step === "number" && param.step > 0
          ? param.step
          : DEFAULT_STEP;
      const value = randomSteppedNumber(min, max, step);
      param.value = value;
      setFlatVariation(block, uniformName, value);
    } else if (isVector4Param(param)) {
      param.value.set(Math.random(), Math.random(), Math.random(), 1);

      if (!block.parameterVariations[uniformName])
        block.parameterVariations[uniformName] = [];
      block.parameterVariations[uniformName]![0] = new LinearVariation4(
        DEFAULT_VARIATION_DURATION,
        param.value,
        param.value,
      );
    } else if (isPaletteParam(param)) {
      param.value.randomize();

      // Keep the PaletteVariation in sync with the randomized param value.
      // The param editor reads the palette from this variation (a clone), not
      // from param.value, so without this the swatch/raw values show stale data
      // even though the preview — which reads param.value — updates. Mirrors the
      // number/vec4 branches above and PaletteParameterControl.updatePaletteVariation.
      if (!block.parameterVariations[uniformName])
        block.parameterVariations[uniformName] = [];
      block.parameterVariations[uniformName]![0] = new PaletteVariation(
        DEFAULT_VARIATION_DURATION,
        param.value,
      );
    }
  }
}

type RandomizeBlockParametersOptions = {
  /**
   * When true (the default), also randomizes the parameters of every effect block
   * currently applied to `block`. Pass false to randomize only `block` itself.
   */
  includeEffectBlocks?: boolean;
};

/**
 * Randomizes every parameter on a block in place, keeping `parameterVariations` in
 * sync the same way each param type's own control does (see
 * {@link setBlockNumberParameterValue}, `ColorParameterControl`,
 * `Palette.randomize`).
 *
 * By default this also randomizes any effect blocks applied to `block`; pass
 * `{ includeEffectBlocks: false }` to scope the randomization to `block` alone.
 */
export function randomizeBlockParameters(
  block: Block,
  { includeEffectBlocks = true }: RandomizeBlockParametersOptions = {},
): void {
  runInAction(() => {
    randomizeParams(block);
    if (includeEffectBlocks) block.effectBlocks.forEach(randomizeParams);
  });
}
