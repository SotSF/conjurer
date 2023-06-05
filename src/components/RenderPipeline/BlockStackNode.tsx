import { WebGLRenderTarget } from "three";
import black from "@/src/shaders/black.frag";
import { useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect } from "react";
import { BlockNode } from "@/src/components/RenderPipeline/BlockNode";
import { useStore } from "@/src/types/StoreContext";
import { Block } from "@/src/types/Block";
import { observer } from "mobx-react-lite";

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
  const { timer } = useStore();

  // initial pass of block stack: update parameters (uniforms). BlockNodes will use these parameters
  // to render the pattern + effects in later priority useFrame calls
  useFrame(({ clock }) => {
    if (!parentBlock) return;

    // mobx linting will complain about these lines if observableRequiresReaction is enabled, but
    // it's fine. We don't want this function to react to changes in these variables - it runs every
    // frame already.
    const { globalTime } = timer;
    const { startTime } = parentBlock;

    if (autorun) {
      // Don't let the elapsed time go over five minutes
      const elapsedTime = clock.elapsedTime % (1000 * 60 * 5);
      parentBlock.updateParameters(elapsedTime);
    } else {
      parentBlock.updateParameters(globalTime - startTime);
    }
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
        fragmentShader={parentBlock?.pattern.src ?? black}
        renderTargetOut={evenNumberOfEffects ? renderTargetOut : renderTargetIn}
      />
      {parentBlock?.effectBlocks.map((effect, i) => {
        const isEven = i % 2 === 0;
        const swap = isEven && evenNumberOfEffects;
        return (
          <BlockNode
            key={effect.id}
            priority={basePriority + i + 2}
            uniforms={effect.pattern.params}
            fragmentShader={effect.pattern.src}
            renderTargetIn={swap ? renderTargetOut : renderTargetIn}
            renderTargetOut={swap ? renderTargetIn : renderTargetOut}
          />
        );
      })}
    </>
  );
});
