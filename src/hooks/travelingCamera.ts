import { PerspectiveCamera as PerspectiveCameraThree } from "three";
import { useFrame } from "@react-three/fiber";

export const useTravelingCamera = (
  cameraRef: { current: PerspectiveCameraThree | null },
  enabled: boolean
) => {
  useFrame((state) => {
    const camera = cameraRef.current;
    if (!camera || !enabled) return;

    camera.position.x = Math.cos(state.clock.elapsedTime * 0.3) * 8;
    camera.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 8;
    camera.position.z = 18;
    camera.updateProjectionMatrix();
  });
};
