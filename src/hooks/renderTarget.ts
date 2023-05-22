import { useMemo } from "react";
import { WebGLRenderTarget } from "three";

// This size greatly affects performance. Somewhat arbitrarily chosen for now. We can lower this as
// needed in the future.
const RENDER_TARGET_SIZE = 256;

export function useRenderTarget() {
  const renderTarget = useMemo(
    () => new WebGLRenderTarget(RENDER_TARGET_SIZE, RENDER_TARGET_SIZE),
    []
  );

  return renderTarget;
}
