import { useStore } from "@/src/types/StoreContext";
import { useEffect } from "react";

/**
 * Tracks the timeline's horizontal scroll window on the store, so components can
 * cheaply ask "is this block anywhere near the view?" and skip rendering the
 * expensive parts of anything that isn't.
 *
 * The window is quantized by the store (see setTimelineViewport), so ordinary
 * scrolling doesn't invalidate every block on every scroll event. Without that,
 * this would trade zoom jank for scroll jank.
 */
export function useTimelineViewportTracking(element: HTMLElement | null) {
  const { uiStore } = useStore();

  useEffect(() => {
    if (!element) return;

    let frame: number | null = null;
    const measure = () => {
      frame = null;
      uiStore.setTimelineViewport(element.scrollLeft, element.clientWidth);
    };
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(measure);
    };

    measure();
    element.addEventListener("scroll", schedule, { passive: true });
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener("scroll", schedule);
      resizeObserver.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [element, uiStore]);
}
