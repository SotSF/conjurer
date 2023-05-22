import { WebGLRenderTarget } from "three";
import black from "@/src/shaders/black.frag";
import { useFrame } from "@react-three/fiber";
import { memo } from "react";
import { BlockNode } from "@/src/components/RenderPipeline/BlockNode";
import { useStore } from "@/src/types/StoreContext";
import { Layer } from "@/src/types/Layer";
import { Block } from "@/src/types/Block";

type LayerNodeProps = {
  autorun?: boolean;
  priority: number;

  // this could be improved: you either supply a block or a layer to this component, but not both.
  block?: Block;
  layer?: Layer;
  renderTargetIn: WebGLRenderTarget;
  renderTargetOut: WebGLRenderTarget;
};

export const LayerNode = memo(function LayerNode({
  autorun,
  priority,
  block,
  layer,
  renderTargetIn,
  renderTargetOut,
}: LayerNodeProps) {
  const { timer } = useStore();
  const targetBlock = block ?? layer?.currentBlock;

  const layerPriority = priority * 100;

  // initial pass of layer: update parameters (uniforms). BlockNodes will use these parameters to
  // render the pattern + effects in later priority useFrame calls
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
      <BlockNode
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
          <BlockNode
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
