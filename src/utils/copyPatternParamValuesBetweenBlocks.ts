import { Block } from "@/src/types/Block";
import { BASE_UNIFORMS } from "@/src/types/Pattern";
import {
  ExtraParams,
  isPaletteParam,
  isTextureParam,
  isVector4Param,
  ParamType,
} from "@/src/types/PatternParams";
import { Palette } from "@/src/types/Palette";
import { runInAction } from "mobx";

/**
 * Copies user-facing uniform values from source.pattern.params to target.pattern.params
 * when both blocks use the same pattern name. Skips engine uniforms (u_time, u_texture).
 *
 * Needed for VJ preview↔live sync: `parameterVariations` alone does not cover every
 * uniform, and `updateParameters` only writes params for keys present in variations.
 */
export function copyPatternParamValuesBetweenBlocks(
  source: Block<ExtraParams>,
  target: Block<ExtraParams>,
) {
  if (source.pattern.name !== target.pattern.name) return;
  const srcParams = source.pattern.params as ExtraParams;
  const tgtParams = target.pattern.params as ExtraParams;

  runInAction(() => {
    for (const uniformName of Object.keys(srcParams)) {
      if (BASE_UNIFORMS.includes(uniformName)) continue;
      const srcP = srcParams[uniformName];
      const tgtP = tgtParams[uniformName];
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
  });
}
