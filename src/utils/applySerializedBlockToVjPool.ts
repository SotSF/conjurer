import { Block, SerializedBlock } from "@/src/types/Block";
import type { Store } from "@/src/types/Store";
import {
  ExtraParams,
  isPaletteParam,
  ParamType,
} from "@/src/types/PatternParams";
import { Palette, SerializedPalette } from "@/src/types/Palette";
import { deserializeVariation } from "@/src/types/Variations/variations";
import { runInAction } from "mobx";

export type VjPresetApplyResult = {
  patternIndex: number;
  effectIndices: number[];
};

/**
 * Applies a serialized pattern block (pattern + params + variations + effect chain)
 * onto the fixed VJ / playground pattern and effect pools, matching by pattern name.
 */
export function applySerializedBlockToVjPool(
  store: Store,
  serializedBlock: SerializedBlock,
  patternBlocks: Block<ExtraParams>[],
  effectBlocks: Block<ExtraParams>[],
): VjPresetApplyResult | null {
  const {
    pattern: transferPattern,
    parameterVariations: transferParameterVariations,
    effectBlocks: transferEffectBlocks,
  } = serializedBlock;

  if (typeof transferPattern === "string") return null;
  const transferParams = transferPattern.params;
  if (!transferParams) return null;

  let result: VjPresetApplyResult | null = null;

  runInAction(() => {
    patternBlocks.forEach(
      (patternBlock: Block<ExtraParams>, patternIndex: number) => {
        if (result !== null) return;
        if (patternBlock.pattern.name !== transferPattern.name) return;

        for (const [uniformName, param] of Object.entries(transferParams)) {
          const playgroundParams = patternBlock.pattern.params as ExtraParams;
          if (playgroundParams[uniformName]) {
            if (isPaletteParam(playgroundParams[uniformName])) {
              (
                playgroundParams[uniformName].value as Palette
              ).setFromSerialized(param.value as SerializedPalette);
            } else {
              playgroundParams[uniformName].value = param.value as ParamType;
            }
          }
        }

        for (const parameter of Object.keys(transferParameterVariations ?? {})) {
          patternBlock.parameterVariations[parameter] =
            transferParameterVariations[parameter]?.map((variationData: any) =>
              deserializeVariation(store, variationData),
            );
        }

        const effectIndices: number[] = [];
        for (const transferEffectBlock of transferEffectBlocks ?? []) {
          effectBlocks.forEach(
            (effectBlock: Block<ExtraParams>, effectIndex: number) => {
              if (typeof transferEffectBlock.pattern === "string") return;
              if (effectBlock.pattern.name !== transferEffectBlock.pattern.name)
                return;
              if (!transferEffectBlock.pattern.params) return;

              const { params } = transferEffectBlock.pattern;
              for (const [uniformName, param] of Object.entries(params)) {
                const playgroundParams = effectBlock.pattern
                  .params as ExtraParams;
                if (playgroundParams[uniformName]) {
                  if (isPaletteParam(playgroundParams[uniformName])) {
                    (
                      playgroundParams[uniformName].value as Palette
                    ).setFromSerialized(param.value as SerializedPalette);
                  } else {
                    playgroundParams[uniformName].value =
                      param.value as ParamType;
                  }
                }
              }

              for (const parameter of Object.keys(
                transferEffectBlock.parameterVariations ?? {},
              )) {
                effectBlock.parameterVariations[parameter] =
                  transferEffectBlock.parameterVariations[parameter]?.map(
                    (variationData: any) =>
                      deserializeVariation(store, variationData),
                  );
              }

              effectIndices.push(effectIndex);
            },
          );
        }

        result = { patternIndex, effectIndices };
      },
    );
  });

  return result;
}
