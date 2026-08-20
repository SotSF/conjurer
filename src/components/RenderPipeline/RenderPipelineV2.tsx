import { useStore } from "@/src/types/StoreContext";
import { MergeNode } from "@/src/components/RenderPipeline/MergeNode";
import {
  useRenderTarget,
  useRenderTargetList,
  useRenderTargets,
} from "@/src/hooks/renderTarget";
import { observer } from "mobx-react-lite";
import { WebGLRenderTarget } from "three";
import { BlockStackNode } from "./BlockStackNode";
import { BlockNode } from "./BlockNode";
import { EffectChainNode } from "./EffectChainNode";
import { LayerV2 } from "@/src/types/Layer/LayerV2";
import { EffectTrack } from "@/src/types/EffectTrack";
import blackFragmentShader from "@/src/shaders/black.frag";
import defaultVertexShader from "@/src/shaders/default.vert";

type Props = {
  renderTargetZ: WebGLRenderTarget;
};

// useFrame priorities run in ascending order, so these bands define the frame
// schedule: within a layer, every block stack renders, then the layer's internal
// merge chain folds them together, then the layer's effect track processes that
// merged output. Every layer completes before the cross-layer merge, which is
// followed by the experience's global effect track writing the final frame.
// Each layer's band accommodates up to 50 concurrent blocks (at 100 priorities
// per block stack) before colliding with its merge chain.
const LAYER_PRIORITY_BAND = 10_000;
const LAYER_MERGE_OFFSET = 5_000;
const LAYER_EFFECT_TRACK_OFFSET = 6_000;
const CROSS_LAYER_MERGE_PRIORITY = 1_000_000;
const GLOBAL_EFFECT_TRACK_PRIORITY = 1_100_000;

export const RenderPipelineV2 = observer(function RenderPipeline({
  renderTargetZ,
}: Props) {
  const store = useStore();
  const layers = store.layers as LayerV2[];
  const layerTargets = useRenderTargetList(layers.length);

  // as in v1, only visible layers currently containing an active block
  // contribute to the output
  const mergeInputs = layerTargets
    .filter((_, i) => layers[i].visible && layers[i].activeBlocks.length > 0)
    .map((target) => ({ target }));

  return (
    <>
      {layers.map((layer, i) =>
        layer.visible ? (
          <LayerNode
            key={layer.id}
            layer={layer}
            basePriority={i * LAYER_PRIORITY_BAND}
            destinationTarget={layerTargets[i]}
          />
        ) : null,
      )}
      <MergeThroughEffectTrack
        mergePriority={CROSS_LAYER_MERGE_PRIORITY}
        trackPriority={GLOBAL_EFFECT_TRACK_PRIORITY}
        track={store.globalEffectTrack}
        inputs={mergeInputs}
        destinationTarget={renderTargetZ}
      />
    </>
  );
});

type LayerNodeProps = {
  layer: LayerV2;
  basePriority: number;
  destinationTarget: WebGLRenderTarget;
};

const LayerNode = observer(function LayerNode({
  layer,
  basePriority,
  destinationTarget,
}: LayerNodeProps) {
  const renderTargets = useRenderTargets(layer);
  const blocks = layer.activeBlocks;
  return (
    <>
      {blocks.map((block, i) => (
        <BlockStackNode
          key={block.id}
          basePriority={basePriority + i * 100}
          parentBlock={block}
          renderTargetIn={renderTargets[0]}
          renderTargetOut={renderTargets[i + 1]}
        />
      ))}
      <MergeThroughEffectTrack
        mergePriority={basePriority + LAYER_MERGE_OFFSET}
        trackPriority={basePriority + LAYER_EFFECT_TRACK_OFFSET}
        track={layer.effectTrack}
        inputs={blocks.map((block, i) => ({
          target: renderTargets[i + 1],
          // opacity is applied here, after the block's entire effect chain
          getOpacity: () =>
            block.currentMergeOpacity(block.store.audioStore.globalTime),
        }))}
        destinationTarget={destinationTarget}
      />
    </>
  );
});

type MergeThroughEffectTrackProps = {
  mergePriority: number;
  trackPriority: number;
  track: EffectTrack;
  inputs: MergeInput[];
  destinationTarget: WebGLRenderTarget;
};

// Merges its inputs and then runs them through a post-composite effect track.
// An empty track merges straight to the destination from here, which keeps the
// track's render targets unallocated for the layers — and the experiences —
// that hold no effects at all.
const MergeThroughEffectTrack = observer(function MergeThroughEffectTrack({
  track,
  ...props
}: MergeThroughEffectTrackProps) {
  if (track.blocks.length === 0)
    return (
      <MergeNodes
        basePriority={props.mergePriority}
        inputs={props.inputs}
        destinationTarget={props.destinationTarget}
      />
    );

  return <MergeThroughPopulatedTrack track={track} {...props} />;
});

// Merges its inputs through a track that holds effects, of which any number may
// be outside their time window at the playhead. With none of them in the signal
// path the merge writes the destination directly, so a track costs extra passes
// only while it is actually doing something.
const MergeThroughPopulatedTrack = observer(
  function MergeThroughPopulatedTrack({
    mergePriority,
    trackPriority,
    track,
    inputs,
    destinationTarget,
  }: MergeThroughEffectTrackProps) {
    // Keyed to the track rather than to the effects in the signal path, so that
    // the targets are allocated once and survive effects coming and going as the
    // playhead moves.
    const trackSource = useRenderTarget();
    const trackScratch = useRenderTarget();

    // effect chain blocks never overlap, so at most one is in the signal path
    const activeBlock = track.activeBlocks[0] ?? null;
    const activeEffects = activeBlock?.effectBlocks ?? [];
    const trackActive = activeEffects.length > 0;

    return (
      <>
        <MergeNodes
          basePriority={mergePriority}
          inputs={inputs}
          destinationTarget={trackActive ? trackSource : destinationTarget}
        />
        {trackActive && activeBlock && (
          <EffectChainNode
            basePriority={trackPriority + 1}
            parameterPriority={trackPriority}
            parameterBlock={activeBlock}
            effectBlocks={activeEffects}
            sourceTarget={trackSource}
            scratchTarget={trackScratch}
            destinationTarget={destinationTarget}
          />
        )}
      </>
    );
  },
);

type MergeInput = {
  target: WebGLRenderTarget;
  // per-frame opacity of this input's contribution (defaults to fully opaque)
  getOpacity?: () => number;
};

type MergeNodesProps = {
  basePriority: number;
  inputs: MergeInput[];
  destinationTarget: WebGLRenderTarget;
};

// Folds any number of input targets into the destination through a chain of
// pairwise additive merges: ((op0*in0 + op1*in1) + op2*in2) + …
const MergeNodes = observer(function MergeNodes({
  basePriority,
  inputs,
  destinationTarget,
}: MergeNodesProps) {
  const scratchA = useRenderTarget();
  const scratchB = useRenderTarget();
  // never rendered to, so it stays black; adding it to a single input is the
  // identity, which passes that input through to the destination
  const blackTarget = useRenderTarget();

  // with no inputs, write opaque black so the canopy samples (0,0,0,1)
  // instead of an uncleared transparent target
  if (inputs.length === 0) {
    return (
      <BlockNode
        priority={basePriority}
        vertexShader={defaultVertexShader}
        fragmentShader={blackFragmentShader}
        renderTargetOut={destinationTarget}
      />
    );
  }

  if (inputs.length === 1) {
    return (
      <MergeNode
        priority={basePriority}
        renderTargetIn1={inputs[0].target}
        renderTargetIn2={blackTarget}
        renderTargetOut={destinationTarget}
        getOpacityIn1={inputs[0].getOpacity}
      />
    );
  }

  const scratch = [scratchA, scratchB];
  // merge k folds inputs[k + 1] into the running total; the scratch targets
  // alternate so a merge never reads the target it writes. Opacity is applied
  // as each input enters the chain; the running total is always carried at
  // full opacity.
  return inputs
    .slice(1)
    .map((input, k) => (
      <MergeNode
        key={k}
        priority={basePriority + k}
        renderTargetIn1={k === 0 ? inputs[0].target : scratch[(k - 1) % 2]}
        renderTargetIn2={input.target}
        renderTargetOut={
          k === inputs.length - 2 ? destinationTarget : scratch[k % 2]
        }
        getOpacityIn1={k === 0 ? inputs[0].getOpacity : undefined}
        getOpacityIn2={input.getOpacity}
      />
    ));
});
