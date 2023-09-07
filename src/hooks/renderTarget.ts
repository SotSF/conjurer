import { useStore } from "@/src/types/StoreContext";
import { useMemo } from "react";
import { WebGLRenderTarget } from "three";

export const useRenderTarget = (width = 0, height = 0) => {
  const { uiStore } = useStore();
  const { renderTargetSize } = uiStore;

  return useMemo(
    () =>
      new WebGLRenderTarget(
        width || renderTargetSize,
        height || renderTargetSize
      ),
    [width, height, renderTargetSize]
  );
};
