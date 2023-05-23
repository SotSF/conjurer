import { WebGLRenderTarget } from "three";
import { Layer } from "@/src/types/Layer";
import { BlockStackNode } from "@/src/components/RenderPipeline/BlockStackNode";
import { observer } from "mobx-react-lite";

type LayerNodeProps = {
  priority: number;
  layer: Layer;
  renderTargetIn: WebGLRenderTarget;
  renderTargetOut: WebGLRenderTarget;
};

export const LayerNode = observer(function LayerNode({
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
