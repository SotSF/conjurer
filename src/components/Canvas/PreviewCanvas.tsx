import { Block } from "../../types/Block";
import { Canvas } from "@react-three/fiber";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { RenderingGate } from "@/src/components/RenderingGate";
import { Canopy } from "@/src/components/Canvas/CanopyView";
import { CameraControls } from "@/src/components/CameraControls";
import { SingleBlockRenderPipeline } from "@/src/components/RenderPipeline/SingleBlockRenderPipeline";
import { useState } from "react";
import { WebGLRenderTarget } from "three";
import { CanopySpaceView } from "@/src/components/Canvas/CanopySpaceView";

type PreviewCanvasProps = {
  block: Block;
};

export const PreviewCanvas = observer(function PreviewCanvas({
  block,
}: PreviewCanvasProps) {
  const { timer, uiStore } = useStore();
  const { displayMode } = uiStore;
  const [renderTarget, setRenderTarget] = useState<WebGLRenderTarget | null>(
    null
  );

  return (
    <Canvas frameloop="demand">
      <RenderingGate shouldRender={!timer.playing} />
      <CameraControls />
      <SingleBlockRenderPipeline
        autorun
        block={block}
        setRenderTarget={setRenderTarget}
      />
      {renderTarget && (
        <>
          {displayMode === "canopy" && <Canopy renderTarget={renderTarget} />}
          <CanopySpaceView renderTarget={renderTarget} />
        </>
      )}
    </Canvas>
  );
});
