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
  return (
    <BlockStackNode
      basePriority={priority * 100}
      parentBlock={layer.currentBlock}
      renderTargetIn={renderTargetIn}
      renderTargetOut={renderTargetOut}
    />
  );
});
