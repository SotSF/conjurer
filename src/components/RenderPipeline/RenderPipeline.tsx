import { WebGLRenderTarget } from "three";
import { LayerNode } from "@/src/components/RenderPipeline/LayerNode";
import { useStore } from "@/src/types/StoreContext";
import { MergeNode } from "@/src/components/RenderPipeline/MergeNode";
import { useRenderTarget } from "@/src/hooks/renderTarget";
import { observer } from "mobx-react-lite";

type RenderPipelineProps = {
  children: (renderTarget: WebGLRenderTarget) => JSX.Element;
};

// TODO: generalize approach here for more than two layers
export const RenderPipeline = observer(function RenderPipeline({
  children,
}: RenderPipelineProps) {
  const store = useStore();

  const renderTargetA = useRenderTarget();
  const renderTargetB = useRenderTarget();
  const renderTargetC = useRenderTarget();
  const renderTargetD = useRenderTarget();

  const activeLayers = store.layers.filter(
    (layer) => layer.visible && !!layer.currentBlock
  );

  // TODO: fix this brute force approach: key={activeLayers.length}
  return (
    <group key={activeLayers.length}>
      {activeLayers.map((layer, index) => (
        <LayerNode
          key={index}
          priority={index}
          layer={layer}
          renderTargetIn={index === 0 ? renderTargetA : renderTargetC}
          renderTargetOut={index === 0 ? renderTargetB : renderTargetD}
        />
      ))}
      {activeLayers.length === 2 && (
        <MergeNode
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
