import { useStore } from "@/src/types/StoreContext";
import { useEffect } from "react";

// Convert wheel delta into a multiplicative zoom factor. Trackpads send many
// small deltas; mouse wheels send larger discrete notches.
const deltaToZoomFactor = (deltaY: number) => Math.exp(-deltaY * 0.005);


export function useWheelZooming(element: HTMLElement | null) {
  const { uiStore } = useStore();

  useEffect(() => {
    if (!element) return;

    // A cmd+scroll or trackpad pinch emits wheel events far faster than a
    // timeline full of blocks can re-render. Zooming on each one queues a whole
    // re-render per event, so the gesture keeps draining long after the fingers
    // stop — a 30-event flick took ~7s (17s when zoomed in) before this.
    //
    // So accumulate the deltas and apply at most one zoom per animation frame.
    // The zoom is multiplicative and deltaToZoomFactor is exponential, so
    // exp(-Σd·k) === Π exp(-dᵢ·k): summing the deltas of the coalesced events
    // lands on exactly the same zoom level as applying each one in turn.
    let pendingDeltaY = 0;
    let anchorClientX: number | undefined;
    let frame: number | null = null;

    const applyPendingZoom = () => {
      frame = null;
      const deltaY = pendingDeltaY;
      pendingDeltaY = 0;
      if (deltaY === 0) return;
      uiStore.zoomBy(deltaToZoomFactor(deltaY), anchorClientX);
    };

    const onWheel = (e: WheelEvent) => {
      // If scrolling horizontally, don't zoom
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // Only zoom when holding ctrl (or meta — trackpad pinch often reports as ctrl)
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();
      pendingDeltaY += e.deltaY;
      // anchor on the latest position, so the zoom follows the cursor if it moves
      anchorClientX = e.clientX;
      if (frame === null) frame = requestAnimationFrame(applyPendingZoom);
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", onWheel);
      if (frame !== null) cancelAnimationFrame(frame);
    };
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
