import { WebGLRenderTarget } from "three";
import { memo, useMemo } from "react";
import { Block } from "@/src/types/Block";
import { LayerNode } from "@/src/components/RenderPipeline/LayerNode";
import { useRenderTarget } from "@/src/hooks/renderTarget";

type SingleBlockRenderPipelineProps = {
  autorun?: boolean;
  block?: Block;
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
        <LayerNode
          autorun={autorun}
          block={block}
          priority={0}
          renderTargetIn={renderTargetA}
          renderTargetOut={renderTargetB}
        />
        {children(renderTargetB)}
      </>
    );
  }
);
