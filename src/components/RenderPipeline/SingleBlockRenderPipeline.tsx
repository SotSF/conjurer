import { WebGLRenderTarget } from "three";
import { memo, useEffect } from "react";
import { Block } from "@/src/types/Block";
import { useRenderTarget } from "@/src/hooks/renderTarget";
import { BlockStackNode } from "@/src/components/RenderPipeline/BlockStackNode";

type Props = {
  autorun?: boolean;
  block: Block | null;
  setRenderTarget: (renderTarget: WebGLRenderTarget) => void;
};

export const SingleBlockRenderPipeline = memo(
  function SingleBlockRenderPipeline({
    autorun,
    block,
    setRenderTarget,
  }: Props) {
    const renderTargetA = useRenderTarget();
    const renderTargetB = useRenderTarget();

    useEffect(() => {
      setRenderTarget(renderTargetB);
    }, [setRenderTarget, renderTargetB]);

    return (
      <BlockStackNode
        autorun={autorun}
        basePriority={0}
        parentBlock={block}
        renderTargetIn={renderTargetA}
        renderTargetOut={renderTargetB}
      />
    );
  }
);
