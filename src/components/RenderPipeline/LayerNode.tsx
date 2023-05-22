import { WebGLRenderTarget } from "three";
import { memo } from "react";
import { Layer } from "@/src/types/Layer";
import { BlockStackNode } from "@/src/components/RenderPipeline/BlockStackNode";

type LayerNodeProps = {
  priority: number;
  layer: Layer;
  renderTargetIn: WebGLRenderTarget;
  renderTargetOut: WebGLRenderTarget;
};

export const LayerNode = memo(function LayerNode({
  priority,
  layer,
  renderTargetIn,
  renderTargetOut,
}: LayerNodeProps) {
  const layerPriority = priority * 100;
  return (
    <BlockStackNode
      basePriority={layerPriority}
      parentBlock={layer.currentBlock}
      renderTargetIn={renderTargetIn}
      renderTargetOut={renderTargetOut}
    />
  );
});
