import { Block } from "../types/Block";
import { Canvas } from "@react-three/fiber";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { RenderPipeline } from "@/src/components/RenderPipeline/RenderPipeline";
import { RenderingGate } from "@/src/components/RenderingGate";
import { Canopy } from "@/src/components/Canopy";
import { CameraControls } from "@/src/components/CameraControls";
import { useMemo } from "react";
import { Vector3 } from "three";

type PreviewCanvasProps = {
  block: Block;
};

export const PreviewCanvas = observer(function PreviewCanvas({
  block,
}: PreviewCanvasProps) {
  const { timer } = useStore();

  const initialPosition = useMemo(() => new Vector3(0, 0, 32), []);

  return (
    <Canvas frameloop="demand">
      <RenderingGate shouldRender={!timer.playing} />
      <CameraControls initialPosition={initialPosition} />
      <RenderPipeline block={block} autorun>
        {(renderTarget) => <Canopy renderTarget={renderTarget} />}
      </RenderPipeline>
    </Canvas>
  );
});
