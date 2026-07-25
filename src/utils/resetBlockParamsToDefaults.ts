import { runInAction } from "mobx";

import { Block } from "@/src/types/Block";
import { BASE_UNIFORMS } from "@/src/types/Pattern";
import { ParamType, isTextureParam } from "@/src/params/shared/patternParam";
import { isPaletteParam } from "@/src/params/palette/isPaletteParam";
import { isVector4Param } from "@/src/params/vector4/isVector4Param";
import { isPalette, Palette } from "@/src/params/palette/Palette";
import { FlatVariation } from "@/src/types/Variations/FlatVariation";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { PaletteVariation } from "@/src/params/palette/variation/PaletteVariation";
import { isVector4 } from "@/src/utils/object";
import { defaultPatternEffectMap } from "@/src/utils/patternsEffects";
import { DEFAULT_VARIATION_DURATION } from "@/src/utils/time";

/**
 * Restores a block's pattern params and flat default variations from the
 * factory defaults in {@link defaultPatternEffectMap}.
 */
export function resetBlockParamsToDefaults(block: Block): void {
  const defaultPattern = defaultPatternEffectMap[block.pattern.name];
  if (!defaultPattern) return;

  const defaultParams = defaultPattern.params;
  const targetParams = block.pattern.params;

  runInAction(() => {
    for (const uniformName of Object.keys(defaultParams)) {
      if (BASE_UNIFORMS.includes(uniformName)) continue;
      const srcP = defaultParams[uniformName];
      const tgtP = targetParams[uniformName];
      if (!srcP || !tgtP) continue;

      if (isPaletteParam(srcP)) {
        (tgtP.value as Palette).setFromSerialized(
          (srcP.value as Palette).serialize(),
        );
      } else if (isVector4Param(srcP)) {
        tgtP.value = srcP.value.clone();
      } else if (isTextureParam(srcP)) {
        tgtP.value = srcP.value;
      } else {
        tgtP.value = srcP.value as ParamType;
      }
    }

    block.parameterVariations = {};

    for (const uniformName of Object.keys(defaultParams)) {
      if (BASE_UNIFORMS.includes(uniformName)) continue;

      const value = targetParams[uniformName]?.value;
      if (value === undefined) continue;

      if (typeof value === "number") {
        block.parameterVariations[uniformName] = [
          new FlatVariation(DEFAULT_VARIATION_DURATION, value),
        ];
      } else if (isVector4(value)) {
        block.parameterVariations[uniformName] = [
          new LinearVariation4(DEFAULT_VARIATION_DURATION, value, value),
        ];
      } else if (isPalette(value)) {
        block.parameterVariations[uniformName] = [
          new PaletteVariation(DEFAULT_VARIATION_DURATION, value),
        ];
      }
    }
  });
}
