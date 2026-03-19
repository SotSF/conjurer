import { PerspectiveCamera } from "@react-three/drei";
import { observer } from "mobx-react-lite";
import { useRef } from "react";
import { PerspectiveCamera as PerspectiveCameraThree, Vector3 } from "three";

export const VJStaticCamera = observer(function VJStaticCamera() {
  const cameraRef = useRef<PerspectiveCameraThree | null>(null);
  const initialPositionRef = useRef(new Vector3(0, 0, 20));

  return (
    <PerspectiveCamera
      // `makeDefault` ensures the rest of the pipeline uses this camera.
      makeDefault
      ref={cameraRef}
      position={initialPositionRef.current}
      near={0.1}
      far={100}
    />
  );
});

