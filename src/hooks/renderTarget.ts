import { useStore } from "@/src/types/StoreContext";
import { useEffect, useMemo } from "react";
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

export const useRenderTargetList = (
  count: number,
  width?: number,
  height?: number,
) => {
  const { renderTargetSize } = useStore().uiStore;
  const targets = useMemo(
    () =>
      Array.from(
        { length: count },
        () =>
          new WebGLRenderTarget(
            width || renderTargetSize,
            height || renderTargetSize,
          ),
      ),
    [count, width, height, renderTargetSize],
  );

  // free the GPU resources of a superseded list
  useEffect(
    () => () => targets.forEach((target) => target.dispose()),
    [targets],
  );

  return targets;
};

// One render target per potentially-concurrent block, plus a shared scratch
// target for effect chain ping-ponging
export const useRenderTargets = (
  layer: LayerV2,
  width?: number,
  height?: number,
) => useRenderTargetList(layer.maxConcurrentBlocks + 1, width, height);
