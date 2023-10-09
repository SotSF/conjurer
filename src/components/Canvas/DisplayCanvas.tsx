import { Canvas } from "@react-three/fiber";
import { Canopy } from "@/src/components/Canvas/CanopyView";
import { Perf } from "r3f-perf";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { RenderPipeline } from "@/src/components/RenderPipeline/RenderPipeline";
import { CanopySpaceView } from "@/src/components/Canvas/CanopySpaceView";
import { CameraControls } from "@/src/components/CameraControls";
import { RenderOnTimeChange } from "@/src/components/RenderOnTimeChange";
import { WebGLRenderTarget } from "three";
import { useState } from "react";
import { CartesianSpaceView } from "@/src/components/Canvas/CartesianSpaceView";

// when DEBUG is true, the canvas will only render when the global time changes. This is useful when
// debugging individual frames.
const DEBUG = false;

export const DisplayCanvas = observer(function DisplayCanvas() {
  const { uiStore, experienceName } = useStore();
  const { displayMode, showingPerformance } = uiStore;

  const [renderTarget, setRenderTarget] = useState<WebGLRenderTarget | null>(
    null
  );

  return (
    <Canvas key={experienceName} frameloop={DEBUG ? "demand" : "always"}>
      {DEBUG && <RenderOnTimeChange />}
      {showingPerformance && <Perf />}
      <CameraControls />
      <RenderPipeline setRenderTarget={setRenderTarget} />
      {renderTarget && (
        <>
          {displayMode === "canopy" && <Canopy renderTarget={renderTarget} />}
          {displayMode === "cartesianSpace" && (
            <CartesianSpaceView
              renderTarget={renderTarget}
              visible={displayMode === "cartesianSpace"}
            />
          )}
          <CanopySpaceView
            renderTarget={renderTarget}
            transmitData={!uiStore.patternDrawerOpen}
            visible={displayMode === "canopySpace"}
          />
        </>
      )}
    </Canvas>
  );
});
