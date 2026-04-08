import { WebGLRenderTarget } from "three";
import { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRenderTarget } from "@/src/hooks/renderTarget";
import { Block } from "@/src/types/Block";
import { BlockStackNode } from "@/src/components/RenderPipeline/BlockStackNode";
import { MergeNode } from "@/src/components/RenderPipeline/MergeNode";

type Props = {
  currentBlock: Block;
  nextBlock: Block;
  setRenderTarget: (renderTarget: WebGLRenderTarget) => void;
};

export const VJCrossfadeRenderPipeline = observer(function VJCrossfadeRenderPipeline({
  currentBlock,
  nextBlock,
  setRenderTarget,
}: Props) {
  // Two-layer pipeline (mirrors RenderPipeline.tsx's 2-layer case).
  const renderTargetA = useRenderTarget();
  const renderTargetB = useRenderTarget();
  const renderTargetC = useRenderTarget();
  const renderTargetD = useRenderTarget();
  const renderTargetZ = useRenderTarget();

  useEffect(() => {
    setRenderTarget(renderTargetZ);
  }, [renderTargetZ, setRenderTarget]);

  return (
    <>
      <BlockStackNode
        autorun
        basePriority={0}
        parentBlock={currentBlock}
        renderTargetIn={renderTargetA}
        renderTargetOut={renderTargetB}
      />
      <BlockStackNode
        autorun
        basePriority={100}
        parentBlock={nextBlock}
        renderTargetIn={renderTargetC}
        renderTargetOut={renderTargetD}
      />
      <MergeNode
        priority={1000}
        renderTargetIn1={renderTargetB}
        renderTargetIn2={renderTargetD}
        renderTargetOut={renderTargetZ}
      />
    </>
  );
});

