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
import { CartesianSpaceView } from "@/src/components/Canvas/CartesianSpaceView";

type PreviewCanvasProps = {
  block: Block;
  frameloop?: "always" | "demand";
};

export const PreviewCanvas = observer(function PreviewCanvas({
  block,
  frameloop = "demand",
}: PreviewCanvasProps) {
  const store = useStore();
  const { uiStore } = store;
  const { playgroundDisplayMode } = uiStore;
  const [renderTarget, setRenderTarget] = useState<WebGLRenderTarget | null>(
    null
  );

  return (
    <Canvas frameloop={frameloop}>
      {frameloop === "demand" && (
        <RenderingGate shouldRender={!store.playing} />
      )}
      <CameraControls />
      <SingleBlockRenderPipeline
        autorun
        block={block}
        setRenderTarget={setRenderTarget}
      />
      {renderTarget && (
        <>
          {playgroundDisplayMode === "canopy" && (
            <Canopy renderTarget={renderTarget} />
          )}
          {playgroundDisplayMode === "cartesianSpace" && (
            <CartesianSpaceView
              renderTarget={renderTarget}
              visible={playgroundDisplayMode === "cartesianSpace"}
            />
          )}
          <CanopySpaceView
            renderTarget={renderTarget}
            transmitData={uiStore.patternDrawerOpen}
            visible={playgroundDisplayMode === "canopySpace"}
          />
        </>
      )}
    </Canvas>
  );
});
