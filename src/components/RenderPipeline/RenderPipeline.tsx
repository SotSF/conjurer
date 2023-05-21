import { WebGLRenderTarget } from "three";
import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Block } from "@/src/types/Block";
import { LayerRenderNode } from "@/src/components/RenderPipeline/LayerRenderNode";

// This size greatly affects performance. Somewhat arbitrarily chosen for now. We can lower this as
// needed in the future.
const RENDER_TARGET_SIZE = 256;

type RenderPipelineProps = {
  autorun?: boolean;
  block?: Block;
  children: (renderTarget: WebGLRenderTarget) => JSX.Element;
};

export const RenderPipeline = observer(function RenderPipeline({
  autorun,
  block,
  children,
}: RenderPipelineProps) {
  const renderTargetA = useMemo(
    () => new WebGLRenderTarget(RENDER_TARGET_SIZE, RENDER_TARGET_SIZE),
    []
  );
  const renderTargetB = useMemo(
    () => new WebGLRenderTarget(RENDER_TARGET_SIZE, RENDER_TARGET_SIZE),
    []
  );

  return (
    <>
      <LayerRenderNode
        autorun={autorun}
        block={block}
        priority={0}
        renderTargetIn={renderTargetA}
        renderTargetOut={renderTargetB}
      />
      {children(renderTargetB)}
    </>
  );
});
