import defaultVertexShader from "@/src/shaders/default.vert";
import black from "@/src/shaders/black.frag";
import conjurerCommon from "@/src/shaders/conjurer_common.frag";
import { WebGLRenderTarget, ShaderChunk } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { BlockNode } from "@/src/components/RenderPipeline/BlockNode";
import { useStore } from "@/src/types/StoreContext";
import { Block } from "@/src/types/Block";
import { observer } from "mobx-react-lite";

// This enables `#include <conjurer_common>`
(ShaderChunk as any).conjurer_common = conjurerCommon;

type BlockStackNodeProps = {
  autorun?: boolean;
  basePriority: number;
  parentBlock: Block | null;
  renderTargetIn: WebGLRenderTarget;
  renderTargetOut: WebGLRenderTarget;
};

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

  // re-render this BlockStackNode if the number of effects changes
  const invalidate = useThree(({ invalidate }) => invalidate);
  useEffect(invalidate, [parentBlock?.effectBlocks.length, invalidate]);

  const numberEffects = parentBlock?.effectBlocks.length ?? 0;
  const evenNumberOfEffects = numberEffects % 2 === 0;
  return (
    <>
      <BlockNode
        priority={basePriority + 1}
        shaderMaterialKey={parentBlock?.id}
        uniforms={parentBlock?.pattern.params}
        vertexShader={parentBlock?.pattern.vertexShader ?? defaultVertexShader}
        fragmentShader={parentBlock?.pattern.fragmentShader ?? black}
        renderTargetOut={evenNumberOfEffects ? renderTargetOut : renderTargetIn}
      />
      {parentBlock?.effectBlocks.map((effect, i) => {
        const isEven = i % 2 === 0;
        // we want XNOR logical operation here, equivalent to strict equal for booleans
        const swap = evenNumberOfEffects === isEven;
        return (
          <BlockNode
            key={effect.id}
            priority={basePriority + i + 2}
            uniforms={effect.pattern.params}
            vertexShader={effect.pattern.vertexShader}
            fragmentShader={effect.pattern.fragmentShader}
            renderTargetIn={swap ? renderTargetOut : renderTargetIn}
            renderTargetOut={swap ? renderTargetIn : renderTargetOut}
          />
        );
      })}
    </>
  );
});
