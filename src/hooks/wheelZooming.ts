import { useStore } from "@/src/types/StoreContext";
import { useEffect } from "react";

// Convert wheel delta into a multiplicative zoom factor. Trackpads send many
// small deltas; mouse wheels send larger discrete notches.
const deltaToZoomFactor = (deltaY: number) => Math.exp(-deltaY * 0.005);

export function useWheelZooming(element: HTMLElement | null) {
  const { uiStore } = useStore();

  useEffect(() => {
    if (!element) return;

    const onWheel = (e: WheelEvent) => {
      // If scrolling horizontally, don't zoom
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // Only zoom when holding ctrl (or meta — trackpad pinch often reports as ctrl)
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();
      uiStore.zoomBy(deltaToZoomFactor(e.deltaY), e.clientX);
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [element, uiStore]);
}

export function useDisableWheelEventPropagation(element: HTMLElement | null) {
  useEffect(() => {
    if (!element) return;

    const onWheel = (e: WheelEvent) => {
      // If inside this container, don't zoom
      e.stopPropagation();
    };

    element.addEventListener("wheel", onWheel);
    return () => element.removeEventListener("wheel", onWheel);
  }, [element]);
}
