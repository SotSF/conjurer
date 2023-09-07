import { useMemo } from "react";
import { WebGLRenderTarget } from "three";

// This size greatly affects performance. Somewhat arbitrarily chosen for now. We can change this as
// needed in the future.
const RENDER_TARGET_SIZE = 512;

export const useRenderTarget = (
  width = RENDER_TARGET_SIZE,
  height = RENDER_TARGET_SIZE
) => useMemo(() => new WebGLRenderTarget(width, height), [width, height]);
