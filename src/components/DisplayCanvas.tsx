import { Canvas } from "@react-three/fiber";
import { Canopy } from "@/src/components/Canopy";
import { Perf } from "r3f-perf";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { RenderPipeline } from "@/src/components/RenderPipeline/RenderPipeline";
import { CartesianView } from "@/src/components/CartesianView";
import { CameraControls } from "@/src/components/CameraControls";
import { RenderOnTimeChange } from "@/src/components/RenderOnTimeChange";
import { ShaderChunk, WebGLRenderTarget } from "three";
import conjurerCommon from "@/src/shaders/conjurer_common.frag";
import { useState } from "react";

// This enables `#include <conjurer_common>`
ShaderChunk.conjurer_common = conjurerCommon;

// when DEBUG is true, the canvas will only render when the global time changes. This is useful when
// debugging individual frames.
const DEBUG = false;

export const DisplayCanvas = observer(function DisplayCanvas() {
  const { uiStore } = useStore();
  const { displayingCanopy, showingPerformance } = uiStore;

  const [renderTarget, setRenderTarget] = useState<WebGLRenderTarget | null>(
    null
  );

  return (
    <Canvas frameloop={DEBUG ? "demand" : "always"}>
      {DEBUG && <RenderOnTimeChange />}
      {showingPerformance && <Perf />}
      <CameraControls />
      <RenderPipeline setRenderTarget={setRenderTarget} />
      {renderTarget && (
        <>
          {displayingCanopy && <Canopy renderTarget={renderTarget} />}
          <CartesianView renderTarget={renderTarget} />
        </>
      )}
    </Canvas>
  );
});
