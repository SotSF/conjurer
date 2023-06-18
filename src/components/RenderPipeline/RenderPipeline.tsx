import { LayerNode } from "@/src/components/RenderPipeline/LayerNode";
import { useStore } from "@/src/types/StoreContext";
import { MergeNode } from "@/src/components/RenderPipeline/MergeNode";
import { useRenderTarget } from "@/src/hooks/renderTarget";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { WebGLRenderTarget } from "three";

type Props = {
  setRenderTarget: (renderTarget: WebGLRenderTarget) => void;
};

// TODO: generalize approach here for more than two layers
export const RenderPipeline = observer(function RenderPipeline({
  setRenderTarget,
}: Props) {
  const store = useStore();

  const renderTargetA = useRenderTarget();
  const renderTargetB = useRenderTarget();
  const renderTargetC = useRenderTarget();
  const renderTargetD = useRenderTarget();
  const renderTargetZ = useRenderTarget();

  const activeLayers = store.layers.filter(
    (layer) => layer.visible && !!layer.currentBlock
  );

  useEffect(() => {
    setRenderTarget(activeLayers.length === 2 ? renderTargetZ : renderTargetB);
  }, [setRenderTarget, activeLayers.length, renderTargetB, renderTargetZ]);

  return (
    <>
      {activeLayers.map((layer, index) => (
        <LayerNode
          key={layer.id}
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
          opacity1={activeLayers[0].opacityParameter}
          renderTargetIn2={renderTargetD}
          opacity2={activeLayers[1].opacityParameter}
          renderTargetOut={renderTargetZ}
        />
      )}
    </>
  );
});
