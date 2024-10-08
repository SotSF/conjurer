import { useStore } from "@/src/types/StoreContext";
import { useMemo } from "react";
import { WebGLRenderTarget } from "three";
import { LayerV2 } from "../types/Layer/LayerV2";

export const useRenderTarget = (width?: number, height?: number) => {
  const { uiStore } = useStore();
  const { renderTargetSize } = uiStore;

  return useMemo(
    () =>
      new WebGLRenderTarget(
        width || renderTargetSize,
        height || renderTargetSize,
      ),
    [width, height, renderTargetSize],
  );
};

export const useRenderTargets = (
  layer: LayerV2,
  width?: number,
  height?: number
) => {
  const { renderTargetSize } = useStore().uiStore;
  return useMemo(() => {
    const numRenderTargets = layer.maxConcurrentBlocks + 1;
    return Array.from(
      { length: numRenderTargets },
      (_) =>
        new WebGLRenderTarget(
          width || renderTargetSize,
          height || renderTargetSize
        )
    );
  }, [layer, width, height, renderTargetSize]);
};
