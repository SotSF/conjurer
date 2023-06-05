import { Canvas } from "@react-three/fiber";
import { Canopy } from "@/src/components/Canopy";
import { Perf } from "r3f-perf";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { RenderPipeline } from "@/src/components/RenderPipeline/RenderPipeline";
import { CartesianView } from "@/src/components/CartesianView";
import { CameraControls } from "@/src/components/CameraControls";
import { useEffect } from "react";
import { ShaderChunk } from "three";
import conjurerCommon from "@/src/shaders/conjurer_common.frag";
import { RenderOnTimeChange } from "@/src/components/RenderOnTimeChange";

// when DEBUG is true, the canvas will only render win the global time changes. This is useful when
// debugging individual frames.
const DEBUG = false;

export const DisplayCanvas = observer(function DisplayCanvas() {
  const { uiStore } = useStore();

  useEffect(() => {
    // This enables `#include <conjurer_common>`
    ShaderChunk.conjurer_common = conjurerCommon;
  }, []);

  return (
    <Canvas
      // trigger a re-instantiation of the canvas when the layout changes
      key={`canopy-${uiStore.horizontalLayout ? "horizontal" : "vertical"}`}
      frameloop={DEBUG ? "demand" : "always"}
    >
      {DEBUG && <RenderOnTimeChange />}
      {uiStore.showingPerformance && <Perf />}
      <CameraControls />
      <RenderPipeline>
        {(renderTarget) =>
          uiStore.displayingCanopy ? (
            <Canopy renderTarget={renderTarget} />
          ) : (
            <CartesianView renderTarget={renderTarget} />
          )
        }
      </RenderPipeline>
    </Canvas>
  );
});
