import { WebGLRenderTarget } from "three";
import black from "@/src/shaders/black.frag";
import { useFrame } from "@react-three/fiber";
import { memo } from "react";
import { BlockRenderNode } from "@/src/components/RenderPipeline/BlockRenderNode";
import { useStore } from "@/src/types/StoreContext";
import { Layer } from "@/src/types/Layer";
import { Block } from "@/src/types/Block";

type LayerRenderNodeProps = {
  autorun?: boolean;
  priority: number;
  block?: Block;
  layer?: Layer;
  renderTargetIn: WebGLRenderTarget;
  renderTargetOut: WebGLRenderTarget;
};

export const LayerRenderNode = memo(function LayerRenderNode({
  autorun,
  priority,
  block,
  layer,
  renderTargetIn,
  renderTargetOut,
}: LayerRenderNodeProps) {
  const { timer } = useStore();
  const targetBlock = block ?? layer?.currentBlock;

  const layerPriority = priority * 100;

  // initial pass: update parameters (uniforms)
  useFrame(({ clock }) => {
    if (!targetBlock) return;

    // mobx linting will complain about these lines if observableRequiresReaction is enabled, but
    // it's fine. We don't want this function to react to changes in these variables - it runs every
    // frame already.
    const { globalTime } = timer;
    const { startTime } = targetBlock;

    if (autorun) {
      // Don't let the elapsed time go over five minutes
      const elapsedTime = clock.elapsedTime % (1000 * 60 * 5);
      targetBlock.updateParameters(elapsedTime, elapsedTime);
    } else {
      targetBlock.updateParameters(globalTime - startTime, globalTime);
    }
  }, layerPriority);

  const numberEffects = targetBlock?.effectBlocks.length ?? 0;
  const evenNumberOfEffects = numberEffects % 2 === 0;
  return (
    <>
      <BlockRenderNode
        priority={layerPriority + 1}
        shaderMaterialKey={targetBlock?.id}
        uniforms={targetBlock?.pattern.params}
        fragmentShader={targetBlock?.pattern.src ?? black}
        renderTargetOut={evenNumberOfEffects ? renderTargetOut : renderTargetIn}
      />
      {targetBlock?.effectBlocks.map((effect, i) => {
        const isEven = i % 2 === 0;
        const swap = isEven && evenNumberOfEffects;
        return (
          <BlockRenderNode
            key={effect.id}
            priority={layerPriority + i + 2}
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
