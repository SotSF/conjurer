import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { PerspectiveCamera as PerspectiveCameraThree, Vector3 } from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useTravelingCamera } from "@/src/hooks/travelingCamera";

// OrbitControls zoom limits for all canopy canvases (playground, VJ, display).
// Lower minDistance = zoom further in; higher maxDistance = zoom further out.
export const CANOPY_MIN_ZOOM_DISTANCE = 5;
// High enough that tall/narrow panels can still fit the canopy at default zoom.
export const CANOPY_MAX_ZOOM_DISTANCE = 80;

// Default camera distance when the canvas is square or wider than tall.
// Three.js FOV is vertical, so in a tall/narrow panel the horizontal view
// shrinks and clips the ~16×16 canopy unless we zoom out by 1/aspect.
const CANOPY_DEFAULT_DISTANCE_SQUARE = 20;

/** Camera distance that keeps the canopy fully in view for the given aspect. */
export function canopyDefaultDistance(aspect: number): number {
  // When aspect >= 1, vertical FOV is limiting — keep the historical default.
  // When aspect < 1, horizontal FOV shrinks — zoom out proportionally.
  const clampedAspect = Math.min(Math.max(aspect, 0.05), 1);
  return CANOPY_DEFAULT_DISTANCE_SQUARE / clampedAspect;
}

type CameraControlsInnerProps = {
  /** When this value changes (and is non-zero), snap back to the default view. */
  viewResetNonce?: number;
};

export const CameraControlsInner = memo(function CameraControlsInner({
  viewResetNonce,
}: CameraControlsInnerProps) {
  const cameraRef = useRef<PerspectiveCameraThree>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { size, invalidate } = useThree();
  const initialPosition = useMemo(() => {
    const aspect = size.width / Math.max(size.height, 1);
    return new Vector3(0, 0, canopyDefaultDistance(aspect));
    // Only on mount — OrbitControls owns the camera position afterward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useTravelingCamera(cameraRef, false);
  // not using traveling camera because it's kinda silly but leaving around for future camera
  // shenanigans
  // useTravelingCamera(cameraRef, viewerMode);

  const resetToDefaultView = useCallback(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const aspect = size.width / Math.max(size.height, 1);
    camera.position.set(0, 0, canopyDefaultDistance(aspect));
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.saveState();
    controls.reset();
    invalidate();
  }, [invalidate, size.height, size.width]);

  useEffect(() => {
    if (!viewResetNonce) return;
    resetToDefaultView();
  }, [resetToDefaultView, viewResetNonce]);

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={initialPosition}
        near={0.1}
        far={200}
      />
      <OrbitControls
        ref={controlsRef}
        camera={cameraRef.current ?? undefined}
        minDistance={CANOPY_MIN_ZOOM_DISTANCE}
        maxDistance={CANOPY_MAX_ZOOM_DISTANCE}
      />
    </>
  );
});
