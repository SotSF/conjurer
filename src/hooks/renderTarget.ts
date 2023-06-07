import { useMemo } from "react";
import { WebGLRenderTarget } from "three";

// This size greatly affects performance. Somewhat arbitrarily chosen for now. We can lower this as
// needed in the future.
const RENDER_TARGET_SIZE = 256;

export function useRenderTarget(size?: { width: number; height: number }) {
  const renderTarget = useMemo(
    () =>
      new WebGLRenderTarget(
        size?.width ?? RENDER_TARGET_SIZE,
        size?.height ?? RENDER_TARGET_SIZE
      ),
    [size]
  );

  return renderTarget;
}
