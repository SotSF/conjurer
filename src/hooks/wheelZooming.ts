import { useStore } from "@/src/types/StoreContext";
import { useCallback, useEffect } from "react";

export function useWheelZooming(element: HTMLElement | null) {
  const { uiStore } = useStore();

  const wheelZooming = useCallback(
    (e: WheelEvent) => {
      // If scrolling horizontally, don't zoom
      if (e.deltaX > 1 || e.deltaX < -1) return;

      // Only zoom when holding ctrl
      if (!e.ctrlKey) return;

      if (e.deltaY > 1) {
        uiStore.zoomOut();
        e.preventDefault();
      } else if (e.deltaY < -1) {
        uiStore.zoomIn();
        e.preventDefault();
      }
    },
    [uiStore],
  );

  useEffect(() => {
    element?.addEventListener("wheel", wheelZooming);
    return () => {
      element?.removeEventListener("wheel", wheelZooming);
    };
  }, [wheelZooming, element]);
}

export function useDisableWheelEventPropagation(element: HTMLElement | null) {
  const wheelZooming = useCallback((e: WheelEvent) => {
    // If inside this container, don't zoom
    e.stopPropagation();
  }, []);

  useEffect(() => {
    if (!element) return;

    element.addEventListener("wheel", wheelZooming);
    const cachedElement = element;
    return () => {
      cachedElement.removeEventListener("wheel", wheelZooming);
    };
  }, [element, wheelZooming]);
}
