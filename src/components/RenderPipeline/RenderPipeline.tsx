import { LayerNode } from "@/src/components/RenderPipeline/LayerNode";
import { useStore } from "@/src/types/StoreContext";
import { MergeNode } from "@/src/components/RenderPipeline/MergeNode";
import { useRenderTarget } from "@/src/hooks/renderTarget";
import { observer } from "mobx-react-lite";
import { WebGLRenderTarget } from "three";

type Props = {
  renderTargetZ: WebGLRenderTarget;
};

// TODO: generalize approach here for more than two layers
export const RenderPipeline = observer(function RenderPipeline({
  renderTargetZ,
}: Props) {
  const store = useStore();

  const renderTargetA = useRenderTarget();
  const renderTargetB = useRenderTarget();
  const renderTargetC = useRenderTarget();
  const renderTargetD = useRenderTarget();

  const activeLayers = store.layers.filter(
    (layer) => layer.visible && !!layer.currentBlock,
  );

  /*
  Because this can all get pretty confusing and it's a custom rendering pipeline, here are the broad
  strokes of what's happening.

  - activeLayers is an array of Layer objects that are visible and have a currentBlock
  - depending on the number of active layers, we render in a different way
  - however in all cases, the final output is renderTargetZ
  - if there's only one active layer, we use renderTargetA as the input and renderTargetZ as the
    output
  - BlockStackNode is representative of the parent pattern block with optional effect blocks
  - BlockStackNode will use (in the one active layer case) renderTargetA and renderTargetZ, and will
    ping pong between them, always outputting to renderTargetZ
  - if there are two active layers, each layer uses two render targets (A/B and C/D) and ping pongs
    between them as before
  - in the two active layer case, MergeNode takes the two layers' output render targets (B/D) and
    merges them together into renderTargetZ
  - the parameters (uniforms) are computed every frame using the useFrame hook with a priority
    appropriate to the pattern/effect order

  That is a pretty terrible explanation. I'll improve it soon/never.
  */
  return (
    <>
      {activeLayers.length === 1 ? (
        <LayerNode
          key={activeLayers[0].id}
          priority={0}
          layer={activeLayers[0]}
          renderTargetIn={renderTargetA}
          renderTargetOut={renderTargetZ}
        />
      ) : (
        activeLayers.map((layer, index) => (
          <LayerNode
            key={layer.id}
            priority={index}
            layer={layer}
            renderTargetIn={index === 0 ? renderTargetA : renderTargetC}
            renderTargetOut={index === 0 ? renderTargetB : renderTargetD}
          />
        ))
      )}
      {activeLayers.length === 2 && (
        <MergeNode
          priority={1000}
          renderTargetIn1={renderTargetB}
          renderTargetIn2={renderTargetD}
          renderTargetOut={renderTargetZ}
        />
      )}
    </>
  );
});
