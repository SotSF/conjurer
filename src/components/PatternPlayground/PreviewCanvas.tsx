import { Block } from "../../types/Block";
import { Canvas } from "@react-three/fiber";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { RenderingGate } from "@/src/components/RenderingGate";
import { Canopy } from "@/src/components/Canopy";
import { CameraControls } from "@/src/components/CameraControls";
import { SingleBlockRenderPipeline } from "@/src/components/RenderPipeline/SingleBlockRenderPipeline";
import { useState } from "react";
import { WebGLRenderTarget } from "three";

type PreviewCanvasProps = {
  block: Block;
};

export const PreviewCanvas = observer(function PreviewCanvas({
  block,
}: PreviewCanvasProps) {
  const { timer } = useStore();
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
      {renderTarget && <Canopy renderTarget={renderTarget} />}
    </Canvas>
  );
});
