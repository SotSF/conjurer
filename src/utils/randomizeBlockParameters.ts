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

const round2 = (value: number) => Math.round(value * 100) / 100;

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
      const value = round2(min + Math.random() * (max - min));
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

/**
 * Randomizes every parameter on a pattern block (and any effect blocks currently
 * applied to it) in place, keeping `parameterVariations` in sync the same way each
 * param type's own control does (see {@link setBlockNumberParameterValue},
 * `ColorParameterControl`, `Palette.randomize`).
 */
export function randomizeBlockParameters(block: Block): void {
  runInAction(() => {
    randomizeParams(block);
    block.effectBlocks.forEach(randomizeParams);
  });
}
