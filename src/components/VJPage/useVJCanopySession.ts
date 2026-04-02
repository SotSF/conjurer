import { useCallback, useEffect, useMemo, useState } from "react";
import { runInAction } from "mobx";

import { Block, SerializedBlock } from "@/src/types/Block";
import { vjEffects, vjPatterns } from "@/src/components/VJPage/vjPageCatalog";
import type { Store } from "@/src/types/Store";
import type { ExtraParams } from "@/src/types/PatternParams";
import { applySerializedBlockToVjPool } from "@/src/utils/applySerializedBlockToVjPool";
import { copyPatternParamValuesBetweenBlocks } from "@/src/utils/copyPatternParamValuesBetweenBlocks";

export type VJCanopySession = {
  selectedPatternIndex: number;
  onSelectPattern: (index: number) => void;

  selectedEffectIndices: number[];
  onToggleEffect: (index: number) => void;

  selectedPatternBlock: Block<ExtraParams>;
  effectBlocks: Block[];

  // Used to force remounts when we replace non-observable `block.pattern`.
  renderNonce: number;

  // Copies the current selection + parameter values from `source` into this session.
  // Used for "Xfade preview to live".
  copySelectionFrom: (source: VJCanopySession) => void;

  /** Applies a saved preset onto this session's pattern/effect pool. Returns false if no match. */
  applySerializedPreset: (serialized: SerializedBlock) => boolean;
};

export const useVJCanopySession = (store: Store): VJCanopySession => {
  const patternBlocks = useMemo(
    () => vjPatterns.map((pattern) => new Block(store, pattern.clone())),
    [store],
  );
  const effectBlocks = useMemo(
    () => vjEffects.map((effect) => new Block(store, effect.clone())),
    [store],
  );

  const [selectedPatternIndex, setSelectedPatternIndex] = useState(0);
  const [selectedEffectIndices, setSelectedEffectIndices] = useState<number[]>(
    [],
  );
  const [renderNonce, setRenderNonce] = useState(0);

  const patternPoolCount = patternBlocks.length;
  const effectPoolCount = effectBlocks.length;

  useEffect(() => {
    if (patternPoolCount === 0) return;
    setSelectedPatternIndex((i) => Math.min(i, patternPoolCount - 1));
  }, [patternPoolCount]);

  useEffect(() => {
    setSelectedEffectIndices((prev) =>
      prev.filter((i) => i >= 0 && i < effectPoolCount),
    );
  }, [effectPoolCount]);

  const applyPatternEffects = useCallback(
    (patternIndex: number, effectIndices: number[]) => {
      const pattern = patternBlocks[patternIndex] ?? patternBlocks[0];

      runInAction(() => {
        // Reset effects, then attach the selected effect blocks in order.
        pattern.effectBlocks = [];
        effectIndices.forEach((effectIndex, i) => {
          const effect = effectBlocks[effectIndex];
          pattern.effectBlocks[i] = effect;
          effect.parentBlock = pattern;
        });
      });
    },
    [effectBlocks, patternBlocks],
  );

  useEffect(() => {
    applyPatternEffects(selectedPatternIndex, selectedEffectIndices);
  }, [applyPatternEffects, selectedEffectIndices, selectedPatternIndex]);

  const onSelectPattern = useCallback((index: number) => {
    setSelectedPatternIndex(index);
  }, []);

  const onToggleEffect = useCallback((index: number) => {
    setSelectedEffectIndices((prev) => {
      const i = prev.indexOf(index);
      if (i >= 0) return prev.filter((e) => e !== index);
      return prev.concat(index);
    });
  }, []);

  const selectedPatternBlock =
    patternBlocks[selectedPatternIndex] ?? patternBlocks[0];

  const cloneParameterVariations = (variations: any): any => {
    const cloned: Record<string, any> = {};
    for (const [key, value] of Object.entries(variations ?? {})) {
      if (!Array.isArray(value)) continue;
      cloned[key] = value.map((v: any) => (v?.clone ? v.clone() : v));
    }
    return cloned;
  };

  const copySelectionFrom = useCallback(
    (source: VJCanopySession) => {
      const sourcePatternBlock = source.selectedPatternBlock;

      let needsRemount = false;

      runInAction(() => {
        const targetPatternBlock =
          patternBlocks[source.selectedPatternIndex] ?? patternBlocks[0];

        // `Block.pattern` is non-observable, so if we replace the pattern object
        // we need a remount for shaderMaterial uniforms to point at the new params.
        if (targetPatternBlock.pattern.name !== sourcePatternBlock.pattern.name) {
          targetPatternBlock.pattern = sourcePatternBlock.pattern.clone();
          needsRemount = true;
        } else {
          copyPatternParamValuesBetweenBlocks(
            sourcePatternBlock,
            targetPatternBlock,
          );
        }
        targetPatternBlock.parameterVariations =
          cloneParameterVariations(sourcePatternBlock.parameterVariations);

        // Copy effect block parameter states for the selected effects.
        source.selectedEffectIndices.forEach((effectIndex) => {
          const sourceEffectBlock = source.effectBlocks[effectIndex];
          const targetEffectBlock = effectBlocks[effectIndex];
          if (!sourceEffectBlock || !targetEffectBlock) return;

          if (
            targetEffectBlock.pattern.name !== sourceEffectBlock.pattern.name
          ) {
            targetEffectBlock.pattern = sourceEffectBlock.pattern.clone();
            needsRemount = true;
          } else {
            copyPatternParamValuesBetweenBlocks(
              sourceEffectBlock,
              targetEffectBlock,
            );
          }
          targetEffectBlock.parameterVariations =
            cloneParameterVariations(sourceEffectBlock.parameterVariations);
        });
      });

      // Update selection so the pattern block attaches the right effect blocks.
      setSelectedPatternIndex(source.selectedPatternIndex);
      setSelectedEffectIndices([...source.selectedEffectIndices]);

      // If the selection didn't change, `block.pattern` replacement won't trigger a re-render
      // because Block.pattern is non-observable. Bump a nonce only if we replaced the
      // pattern objects (which changes shaderMaterial uniforms/fragmentShader inputs).
      if (needsRemount) setRenderNonce((n) => n + 1);
    },
    [effectBlocks, patternBlocks],
  );

  const applySerializedPreset = useCallback(
    (serialized: SerializedBlock) => {
      const applied = applySerializedBlockToVjPool(
        store,
        serialized,
        patternBlocks,
        effectBlocks,
      );
      if (!applied) return false;
      setSelectedPatternIndex(applied.patternIndex);
      setSelectedEffectIndices(applied.effectIndices);
      return true;
    },
    [store, patternBlocks, effectBlocks],
  );

  return {
    selectedPatternIndex,
    onSelectPattern,
    selectedEffectIndices,
    onToggleEffect,
    selectedPatternBlock,
    effectBlocks,
    renderNonce,
    copySelectionFrom,
    applySerializedPreset,
  };
};

