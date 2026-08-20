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
  // when set, this node drives parameterBlock's uniforms at that priority,
  // which must come before basePriority. Chains hanging off a pattern block
  // leave this unset: the pattern block already updates its effects' params
  // along with its own.
  parameterPriority?: number;
  // the chain block these effects belong to, whose timeline they run on
  parameterBlock?: Block;
  effectBlocks: Block[];
  // holds the chain's input; read by the first effect and by nothing after it
  sourceTarget: WebGLRenderTarget;
  // the chain ping-pongs between this and destinationTarget. May be the source
  // target itself when the caller has no third target to spare: the first
  // effect consumes the source before anything writes the scratch.
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
  parameterBlock,
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
      {parameterPriority !== undefined && parameterBlock && (
        <EffectTrackParameterNode
          priority={parameterPriority}
          block={parameterBlock}
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

type EffectTrackParameterNodeProps = {
  priority: number;
  block: Block;
};

// Drives a chain block's uniforms ahead of the passes that consume them. The
// block's own update recurses into its effects, so they all run on its
// timeline — the same relationship a pattern block has with its effects.
const EffectTrackParameterNode = observer(function EffectTrackParameterNode({
  priority,
  block,
}: EffectTrackParameterNodeProps) {
  const { audioStore } = useStore();

  useFrame(() => {
    // mobx linting will complain about reading globalTime here if
    // observableRequiresReaction is enabled, but it's fine. We don't want this
    // function to react to it - it runs every frame already.
    const { globalTime } = audioStore;
    block.updateParameters(globalTime - block.startTime);
  }, priority);

  return null;
});
