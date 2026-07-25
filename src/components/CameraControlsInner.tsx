import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { PerspectiveCamera as PerspectiveCameraThree, Vector3 } from "three";
import { memo, useRef } from "react";
import { useTravelingCamera } from "@/src/hooks/travelingCamera";

// OrbitControls zoom limits for all canopy canvases (playground, VJ, display).
// Lower minDistance = zoom further in; higher maxDistance = zoom further out.
// Default camera starts at z = 20.
export const CANOPY_MIN_ZOOM_DISTANCE = 5;
export const CANOPY_MAX_ZOOM_DISTANCE = 40;

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
      <OrbitControls
        camera={cameraRef.current ?? undefined}
        minDistance={CANOPY_MIN_ZOOM_DISTANCE}
        maxDistance={CANOPY_MAX_ZOOM_DISTANCE}
      />
    </>
  );
});
