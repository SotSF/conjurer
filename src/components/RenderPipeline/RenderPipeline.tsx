import { WebGLRenderTarget } from "three";
import { memo, useMemo } from "react";
import { Block } from "@/src/types/Block";
import { LayerRenderNode } from "@/src/components/RenderPipeline/LayerRenderNode";
import { useStore } from "@/src/types/StoreContext";
import { LayerMergeNode } from "@/src/components/RenderPipeline/LayerMergeNode";
import { useRenderTarget } from "@/src/hooks/renderTarget";

type RenderPipelineProps = {
  autorun?: boolean;
  block?: Block;
  children: (renderTarget: WebGLRenderTarget) => JSX.Element;
};

export const RenderPipeline = memo(function RenderPipeline({
  autorun,
  block,
  children,
}: RenderPipelineProps) {
  const store = useStore();

  const renderTargetA = useRenderTarget();
  const renderTargetB = useRenderTarget();
  const renderTargetC = useRenderTarget();
  const renderTargetD = useRenderTarget();

  if (block) {
    // when a single block is supplied, we only need to render one layer
    return (
      <>
        <LayerRenderNode
          autorun={autorun}
          block={block}
          priority={0}
          renderTargetIn={renderTargetA}
          renderTargetOut={renderTargetB}
        />
        {children(renderTargetB)}
      </>
    );
  }

  const activeLayers = store.layers.filter((layer) => !!layer.currentBlock);

  // TODO: fix this brute force approach: key={activeLayers.length}
  return (
    <group key={activeLayers.length}>
      {activeLayers.map((layer, index) => (
        <LayerRenderNode
          key={index}
          priority={index}
          layer={layer}
          renderTargetIn={index === 0 ? renderTargetA : renderTargetC}
          renderTargetOut={index === 0 ? renderTargetB : renderTargetD}
        />
      ))}
      {activeLayers.length === 2 && (
        <LayerMergeNode
          priority={10000}
          renderTargetIn1={renderTargetB}
          renderTargetIn2={renderTargetD}
          renderTargetOut={renderTargetA}
        />
      )}
      {children(activeLayers.length === 2 ? renderTargetA : renderTargetB)}
    </group>
  );
});
