import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { PerspectiveCamera as PerspectiveCameraThree, Vector3 } from "three";
import { memo, useRef } from "react";
import { useTravelingCamera } from "@/src/hooks/travelingCamera";

type CameraControlsInnerProps = {};

export const CameraControlsInner = memo(function CameraControlsInner({}: CameraControlsInnerProps) {
  const cameraRef = useRef<PerspectiveCameraThree>(null);
  const initialPositionRef = useRef(new Vector3(0, 0, 20));

  useTravelingCamera(cameraRef, false);
  // not using traveling camera because it's kinda silly but leaving around for future camera
  // shenanigans
  // useTravelingCamera(cameraRef, viewerMode);

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
});
