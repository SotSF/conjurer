import { Canvas } from "@react-three/fiber";
import { Canopy } from "@/src/components/Canopy";
import { Perf } from "r3f-perf";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { RenderPipeline } from "@/src/components/RenderPipeline/RenderPipeline";
import { CartesianView } from "@/src/components/CartesianView";
import { CameraControls } from "@/src/components/CameraControls";

export const DisplayCanvas = observer(function DisplayCanvas() {
  const { uiStore } = useStore();

  return (
    <Canvas
      // trigger a re-instantiation of the canvas when the layout changes
      key={`canopy-${uiStore.horizontalLayout ? "horizontal" : "vertical"}`}
    >
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
