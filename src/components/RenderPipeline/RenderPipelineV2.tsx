import { useStore } from "@/src/types/StoreContext";
import { MergeNode } from "@/src/components/RenderPipeline/MergeNode";
import { useRenderTarget, useRenderTargets } from "@/src/hooks/renderTarget";
import { observer } from "mobx-react-lite";
import { WebGLRenderTarget } from "three";
import { BlockStackNode } from "./BlockStackNode";
import { LayerV2 } from "@/src/types/Layer/LayerV2";

type Props = {
  renderTargetZ: WebGLRenderTarget;
};

export const RenderPipelineV2 = observer(function RenderPipeline({
  renderTargetZ,
}: Props) {
  const store = useStore();
  const layers = store.layers as LayerV2[];
  if (layers.length === 0) return null;
  return <LayerNode layer={layers[0]} destinationTarget={renderTargetZ} />;
});

type LayerNodeProps = {
  layer: LayerV2;
  destinationTarget: WebGLRenderTarget;
};

const LayerNode = observer(({ layer, destinationTarget }: LayerNodeProps) => {
  const renderTargets = useRenderTargets(layer);
  const blocks = layer.activeBlocks;
  return (
    <>
      {blocks.map((block, i) => (
        <BlockStackNode
          key={block.id}
          basePriority={i * 100}
          parentBlock={block}
          renderTargetIn={renderTargets[0]}
          renderTargetOut={renderTargets[i + 1]}
        />
      ))}
      <MergeNodes
        inputs={renderTargets.slice(1, blocks.length + 1)}
        destinationTarget={destinationTarget}
      />
    </>
  );
});

type MergeNodesProps = {
  inputs: WebGLRenderTarget[];
  destinationTarget: WebGLRenderTarget;
};

const MergeNodes = observer(
  ({ inputs, destinationTarget }: MergeNodesProps) => {
    const pingTarget = useRenderTarget();
    const pongTarget = useRenderTarget();
    return inputs.map((inputTarget, i) => {
      const isEven = i % 2 === 0;
      const isLast = i === inputs.length - 1;
      return (
        <MergeNode
          key={i}
          priority={10_000 + i}
          renderTargetIn1={isEven ? pingTarget : pongTarget}
          renderTargetIn2={inputTarget}
          renderTargetOut={
            isLast ? destinationTarget : isEven ? pongTarget : pingTarget
          }
        />
      );
    });
  },
);
