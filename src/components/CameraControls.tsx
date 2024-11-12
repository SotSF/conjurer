import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { PerspectiveCamera as PerspectiveCameraThree, Vector3 } from "three";
import { useRef } from "react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { useTravelingCamera } from "@/src/hooks/travelingCamera";

type CameraControlsProps = {};

export const CameraControls = observer(
  function CameraControls({}: CameraControlsProps) {
    const { viewerMode } = useStore();

    const cameraRef = useRef<PerspectiveCameraThree>(null);
    const initialPositionRef = useRef(new Vector3(0, 0, 20));

    useTravelingCamera(cameraRef, viewerMode);

    return (
      <>
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={initialPositionRef.current}
          near={0.1}
          far={100}
        />
        <OrbitControls camera={cameraRef.current ?? undefined} />
      </>
    );
  }
);
