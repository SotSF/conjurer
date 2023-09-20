import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { PerspectiveCamera as PerspectiveCameraThree, Vector3 } from "three";
import { memo, useRef } from "react";

type CameraControlsProps = {
  initialPosition?: Vector3;
};

export const CameraControls = memo(function CameraControls({
  initialPosition = new Vector3(0, 0, 20),
}: CameraControlsProps) {
  const cameraRef = useRef<PerspectiveCameraThree>(null);
  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={initialPosition}
        near={0.1}
        far={100}
      />
      <OrbitControls camera={cameraRef.current ?? undefined} />
    </>
  );
});
