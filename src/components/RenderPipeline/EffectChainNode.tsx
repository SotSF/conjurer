import { WebGLRenderTarget } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Block } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";

type EffectChainNodeProps = {
  // priority of the first effect's render pass; effect i renders at
  // basePriority + i
  basePriority: number;
  // when set, this node drives each effect block's uniforms at that priority,
  // which must come before basePriority. Chains hanging off a pattern block
  // leave this unset: the pattern block already updates its effects' params
  // along with its own.
  parameterPriority?: number;
  effectBlocks: Block[];
  // holds the chain's input; only ever read
  sourceTarget: WebGLRenderTarget;
  // the chain ping-pongs between this and destinationTarget
  scratchTarget: WebGLRenderTarget;
  // receives the last effect's output
  destinationTarget: WebGLRenderTarget;
};

/**
 * Runs an ordered list of effect blocks between a source and a destination
 * render target.
 *
 * Effects alternate their output between the destination and the scratch target
 * from the back of the chain forwards, so the last effect lands in the
 * destination and no pass ever reads the target it writes. With an odd number of
 * effects the first one writes the destination, so callers that also produce the
 * source must put it in the scratch target in that case (see BlockStackNode).
 */
export const EffectChainNode = observer(function EffectChainNode({
  basePriority,
  parameterPriority,
  effectBlocks,
  sourceTarget,
  scratchTarget,
  destinationTarget,
}: EffectChainNodeProps) {
  // re-render this node if the number of effects changes
  const invalidate = useThree(({ invalidate }) => invalidate);
  useEffect(invalidate, [effectBlocks.length, invalidate]);

  const lastIndex = effectBlocks.length - 1;
  const targetOut = (index: number) =>
    (lastIndex - index) % 2 === 0 ? destinationTarget : scratchTarget;

  return (
    <>
      {parameterPriority !== undefined && (
        <EffectChainParameterNode
          priority={parameterPriority}
          effectBlocks={effectBlocks}
        />
      )}
      {effectBlocks.map((effectBlock, i) => {
        const { pattern } = effectBlock;
        return (
          <pattern.Component
            key={effectBlock.id}
            pattern={pattern}
            priority={basePriority + i}
            renderTargetIn={i === 0 ? sourceTarget : targetOut(i - 1)}
            renderTargetOut={targetOut(i)}
          />
        );
      })}
    </>
  );
});

type EffectChainParameterNodeProps = {
  priority: number;
  effectBlocks: Block[];
};

// Drives the uniforms of a chain whose blocks each run on their own timeline,
// ahead of the passes that consume them.
const EffectChainParameterNode = observer(function EffectChainParameterNode({
  priority,
  effectBlocks,
}: EffectChainParameterNodeProps) {
  const { audioStore } = useStore();

  useFrame(() => {
    // mobx linting will complain about reading globalTime here if
    // observableRequiresReaction is enabled, but it's fine. We don't want this
    // function to react to it - it runs every frame already.
    const { globalTime } = audioStore;
    for (const effectBlock of effectBlocks)
      effectBlock.updateParameters(globalTime - effectBlock.startTime);
  }, priority);

  return null;
});
