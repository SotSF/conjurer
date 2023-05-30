import { WebGLRenderTarget } from "three";
import { Layer } from "@/src/types/Layer";
import { BlockStackNode } from "@/src/components/RenderPipeline/BlockStackNode";
import { observer } from "mobx-react-lite";
import { useFrame } from "@react-three/fiber";
import { useStore } from "@/src/types/StoreContext";

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
  const { timer } = useStore();

  const { opacityBlock } = layer;

  const layerPriority = priority * 100;
  useFrame(() => {
    if (!opacityBlock) return;

    // mobx linting will complain about these lines if observableRequiresReaction is enabled, but
    // it's fine. We don't want this function to react to changes in these variables - it runs every
    // frame already.
    const { globalTime } = timer;
    const { startTime } = opacityBlock;

    opacityBlock.updateParameters(globalTime - startTime);
  }, layerPriority);

  return (
    <BlockStackNode
      basePriority={layerPriority}
      parentBlock={layer.currentBlock}
      renderTargetIn={renderTargetIn}
      renderTargetOut={renderTargetOut}
    />
  );
});
