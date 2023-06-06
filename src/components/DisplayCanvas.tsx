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

// when DEBUG is true, the canvas will only render win the global time changes. This is useful when
// debugging individual frames.
const DEBUG = false;

export const DisplayCanvas = observer(function DisplayCanvas() {
  const { uiStore } = useStore();
  const [renderTarget, setRenderTarget] = useState<WebGLRenderTarget | null>(
    null
  );

  return (
    <Canvas
      // trigger a re-instantiation of the canvas when the layout changes
      key={`canopy-${uiStore.horizontalLayout ? "horizontal" : "vertical"}`}
      frameloop={DEBUG ? "demand" : "always"}
    >
      {DEBUG && <RenderOnTimeChange />}
      {uiStore.showingPerformance && <Perf />}
      <CameraControls />
      <RenderPipeline setRenderTarget={setRenderTarget} />
      {renderTarget &&
        (uiStore.displayingCanopy ? (
          <Canopy renderTarget={renderTarget} />
        ) : (
          <CartesianView renderTarget={renderTarget} />
        ))}
    </Canvas>
  );
});
