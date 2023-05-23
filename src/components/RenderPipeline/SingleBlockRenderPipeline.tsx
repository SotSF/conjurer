import { WebGLRenderTarget } from "three";
import { memo } from "react";
import { Block } from "@/src/types/Block";
import { useRenderTarget } from "@/src/hooks/renderTarget";
import { BlockStackNode } from "@/src/components/RenderPipeline/BlockStackNode";

type SingleBlockRenderPipelineProps = {
  autorun?: boolean;
  block: Block | null;
  children: (renderTarget: WebGLRenderTarget) => JSX.Element;
};

export const SingleBlockRenderPipeline = memo(
  function SingleBlockRenderPipeline({
    autorun,
    block,
    children,
  }: SingleBlockRenderPipelineProps) {
    const renderTargetA = useRenderTarget();
    const renderTargetB = useRenderTarget();

    return (
      <>
        <BlockStackNode
          autorun={autorun}
          basePriority={0}
          parentBlock={block}
          renderTargetIn={renderTargetA}
          renderTargetOut={renderTargetB}
        />
        {children(renderTargetB)}
      </>
    );
  }
);
