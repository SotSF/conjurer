import { runInAction } from "mobx";

import { Block } from "@/src/types/Block";
import type { PlaygroundStore } from "@/src/types/PlaygroundStore";
import { BASE_UNIFORMS } from "@/src/types/Pattern";
import { FlatVariation } from "@/src/types/Variations/FlatVariation";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { PaletteVariation } from "@/src/params/palette/variation/PaletteVariation";
import { isPalette, Palette } from "@/src/params/palette/Palette";
import { isPaletteParam } from "@/src/params/palette/isPaletteParam";
import { isVector4Param } from "@/src/params/vector4/isVector4Param";
import { isTextureParam } from "@/src/params/shared/patternParam";
import { isVector4 } from "@/src/utils/object";
import { paramValueAtTime } from "@/src/utils/paramValueAtTime";
import { DEFAULT_VARIATION_DURATION } from "@/src/utils/time";
import { Texture } from "three";

/**
 * Overwrites a playground pool block's params with single flat values sampled
 * from `source` at `globalTime` (no automation / periodic chains).
 */
function applySnapshotParams(
  source: Block,
  target: Block,
  globalTime: number,
): void {
  target.parameterVariations = {};

  for (const uniformName of Object.keys(source.pattern.params)) {
    if (BASE_UNIFORMS.includes(uniformName)) continue;

    const tgtP = target.pattern.params[uniformName];
    if (!tgtP) continue;

    const value = paramValueAtTime(source, uniformName, globalTime);
    if (value == null) continue;

    if (isPaletteParam(tgtP) && isPalette(value)) {
      (tgtP.value as Palette).setFromSerialized(value.serialize());
      target.parameterVariations[uniformName] = [
        new PaletteVariation(
          DEFAULT_VARIATION_DURATION,
          tgtP.value as Palette,
        ),
      ];
    } else if (isVector4Param(tgtP) && isVector4(value)) {
      tgtP.value = value.clone();
      target.parameterVariations[uniformName] = [
        new LinearVariation4(
          DEFAULT_VARIATION_DURATION,
          tgtP.value,
          tgtP.value,
        ),
      ];
    } else if (isTextureParam(tgtP) && value instanceof Texture) {
      tgtP.value = value;
    } else if (typeof value === "number") {
      tgtP.value = value;
      target.parameterVariations[uniformName] = [
        new FlatVariation(DEFAULT_VARIATION_DURATION, value),
      ];
    }
  }
}

export type LoadBlockIntoPlaygroundResult = {
  patternIndex: number;
  effectIndices: number[];
};

/**
 * Loads a timeline block's pattern + effect chain into the playground pools,
 * overwriting matching entries with flat param snapshots. Samples at the
 * playhead when it falls inside the block; otherwise at the block start.
 */
export function loadBlockIntoPlayground(
  playgroundStore: PlaygroundStore,
  block: Block,
): LoadBlockIntoPlaygroundResult | null {
  const patternIndex = playgroundStore.patternBlocks.findIndex(
    (b) => b.pattern.name === block.pattern.name,
  );
  if (patternIndex < 0) return null;

  const globalTime = playgroundStore.store.audioStore.globalTime;
  const evalTime = block.isActive() ? globalTime : block.startTime;

  let result: LoadBlockIntoPlaygroundResult | null = null;

  runInAction(() => {
    applySnapshotParams(
      block,
      playgroundStore.patternBlocks[patternIndex],
      evalTime,
    );

    const effectIndices: number[] = [];
    for (const effect of block.effectBlocks) {
      const effectIndex = playgroundStore.effectBlocks.findIndex(
        (b) => b.pattern.name === effect.pattern.name,
      );
      if (effectIndex < 0) continue;

      applySnapshotParams(
        effect,
        playgroundStore.effectBlocks[effectIndex],
        evalTime,
      );
      effectIndices.push(effectIndex);
    }

    playgroundStore.selectedPatternIndex = patternIndex;
    playgroundStore.selectedEffectIndices = effectIndices;
    playgroundStore.lastPatternIndexSelected = patternIndex;
    playgroundStore.lastEffectIndices = effectIndices;
    playgroundStore.controlsNonce++;

    result = { patternIndex, effectIndices };
  });

  return result;
}
