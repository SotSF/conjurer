import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { WebGLRenderTarget } from "three";

import { Block } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { RenderingGate } from "@/src/components/RenderingGate";
import { CameraControls } from "@/src/components/CameraControls";
import { SingleBlockRenderPipeline } from "@/src/components/RenderPipeline/SingleBlockRenderPipeline";
import { VJStaticCamera } from "@/src/components/VJPage/VJStaticCamera";
import { Canopy } from "@/src/components/Canvas/CanopyView";
import { CanopySpaceView } from "@/src/components/Canvas/CanopySpaceView";
import { CartesianSpaceView } from "@/src/components/Canvas/CartesianSpaceView";

export type VJDisplayMode = "canopy" | "canopySpace" | "cartesianSpace" | "none";

type Props = {
  block: Block;
  displayMode: VJDisplayMode;
  transmitDataEnabled?: boolean;
  enableCameraControls?: boolean;
  frameloop?: "always" | "demand";
};

export const VJPreviewCanvas = observer(function VJPreviewCanvas({
  block,
  displayMode,
  transmitDataEnabled = false,
  enableCameraControls = true,
  frameloop = "demand",
}: Props) {
  const store = useStore();
  const [renderTarget, setRenderTarget] = useState<WebGLRenderTarget | null>(
    null,
  );

  const transmitData = store.context === "vj" && transmitDataEnabled;

  return (
    <Canvas frameloop={frameloop}>
      {frameloop === "demand" && (
        <RenderingGate shouldRender={!store.playing} />
      )}
      {enableCameraControls ? <CameraControls /> : <VJStaticCamera />}
      <SingleBlockRenderPipeline
        autorun
        block={block}
        setRenderTarget={setRenderTarget}
      />
      {renderTarget && (
        <>
          {displayMode === "canopy" && <Canopy renderTarget={renderTarget} />}
          {displayMode === "cartesianSpace" && (
            <CartesianSpaceView
              renderTarget={renderTarget}
              visible={displayMode === "cartesianSpace"}
            />
          )}
          {displayMode === "canopySpace" && (
            <CanopySpaceView
              renderTarget={renderTarget}
              transmitData={transmitData}
              visible={displayMode === "canopySpace"}
            />
          )}
        </>
      )}
    </Canvas>
  );
});

