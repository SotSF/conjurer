import defaultVertexShader from "@/src/shaders/default.vert";
import blackFragmentShader from "@/src/shaders/black.frag";
import conjurerCommon from "@/src/shaders/conjurer_common.frag";
import { WebGLRenderTarget, ShaderChunk } from "three";
import { useFrame } from "@react-three/fiber";
import { EffectChainNode } from "@/src/components/RenderPipeline/EffectChainNode";
import { useStore } from "@/src/types/StoreContext";
import { Block } from "@/src/types/Block";
import { observer } from "mobx-react-lite";
import { Pattern } from "@/src/types/Pattern";

// This enables `#include <conjurer_common>`
(ShaderChunk as any).conjurer_common = conjurerCommon;

type BlockStackNodeProps = {
  autorun?: boolean;
  basePriority: number;
  parentBlock: Block | null;
  renderTargetIn: WebGLRenderTarget;
  renderTargetOut: WebGLRenderTarget;
};

// stable identity so a block stack without a block doesn't hand the effect
// chain a new array every render
const emptyEffectBlocks: Block[] = [];

const defaultPattern = new Pattern("default", blackFragmentShader);

defaultPattern.fragmentShader = defaultVertexShader;

export const BlockStackNode = observer(function BlockStackNode({
  autorun,
  basePriority,
  parentBlock,
  renderTargetIn,
  renderTargetOut,
}: BlockStackNodeProps) {
  const { audioStore } = useStore();

  // initial pass of block stack: update parameters (uniforms). BlockNodes will use these parameters
  // to render the pattern + effects in later priority useFrame calls
  useFrame(({ clock }) => {
    if (!parentBlock) return;

    if (autorun) {
      parentBlock.updateParameters(clock.elapsedTime, true);
      return;
    }

    // mobx linting will complain about these lines if observableRequiresReaction is enabled, but
    // it's fine. We don't want this function to react to changes in these variables - it runs every
    // frame already.
    const { globalTime } = audioStore;
    const { startTime } = parentBlock;
    parentBlock.updateParameters(globalTime - startTime);
  }, basePriority);

  const effectBlocks = parentBlock?.effectBlocks ?? emptyEffectBlocks;
  // The chain alternates its output from the back forwards and must finish in
  // renderTargetOut, so with an odd number of effects the first one writes
  // renderTargetOut — meaning the pattern has to go to renderTargetIn.
  const evenNumberOfEffects = effectBlocks.length % 2 === 0;
  const patternTarget = evenNumberOfEffects ? renderTargetOut : renderTargetIn;
  const pattern = parentBlock?.pattern ?? defaultPattern;

  return (
    <>
      <pattern.Component
        pattern={pattern}
        priority={basePriority + 1}
        shaderMaterialKey={parentBlock?.id}
        renderTargetOut={patternTarget}
      />
      {/* With an odd number of effects the pattern is in renderTargetIn, which
          the first effect consumes — from then on it is free to serve as the
          chain's scratch. */}
      <EffectChainNode
        basePriority={basePriority + 2}
        effectBlocks={effectBlocks}
        sourceTarget={patternTarget}
        scratchTarget={renderTargetIn}
        destinationTarget={renderTargetOut}
      />
    </>
  );
});
