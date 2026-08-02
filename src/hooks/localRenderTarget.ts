import { useEffect, useMemo } from "react";
import { WebGLRenderTarget } from "three";

/**
 * Store-free render target hook for pattern/effect components.
 * Safe to import from the effects graph (unlike useRenderTarget).
 */
export const useLocalRenderTarget = (width: number, height = width) => {
  const target = useMemo(
    () => new WebGLRenderTarget(width, height),
    [width, height],
  );

  useEffect(() => () => target.dispose(), [target]);

  return target;
};
