import { observer } from "mobx-react-lite";
import { Box } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useCallback, useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import { TIMELINE_HEADER_WIDTH } from "@/src/types/UIStore";
import { clamp } from "three/src/math/MathUtils";

type ViewfinderRect = {
  leftPct: number;
  widthPct: number;
};

const computeViewfinder = (
  timeline: HTMLElement,
  duration: number,
  pixelsPerSecond: number,
): ViewfinderRect | null => {
  if (duration <= 0 || pixelsPerSecond <= 0) return null;

  const visibleWidth = Math.max(0, timeline.clientWidth - TIMELINE_HEADER_WIDTH);
  const startTime = timeline.scrollLeft / pixelsPerSecond;
  const visibleDuration = visibleWidth / pixelsPerSecond;

  const leftPct = clamp((startTime / duration) * 100, 0, 100);
  const widthPct = clamp((visibleDuration / duration) * 100, 0, 100 - leftPct);

  return { leftPct, widthPct };
};

/**
 * Highlights the portion of the song currently visible in the timeline viewport,
 * drawn over the Wavesurfer minimap. Drag to pan the timeline.
 */
export const MinimapViewfinder = observer(function MinimapViewfinder() {
  const store = useStore();
  const { audioStore, uiStore } = store;
  const [rect, setRect] = useState<ViewfinderRect | null>(null);

  const update = useCallback(() => {
    const timeline = document.getElementById("timeline");
    const duration = audioStore.wavesurfer?.getDuration() ?? 0;
    if (!timeline) {
      setRect(null);
      return;
    }
    setRect(computeViewfinder(timeline, duration, uiStore.pixelsPerSecond));
  }, [audioStore.wavesurfer, uiStore.pixelsPerSecond]);

  useEffect(() => {
    const timeline = document.getElementById("timeline");
    if (!timeline) return;

    update();
    timeline.addEventListener("scroll", update, { passive: true });

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(timeline);

    return () => {
      timeline.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, [update]);

  // Recompute when zoom or audio readiness changes (duration becomes available)
  useEffect(() => {
    update();
  }, [
    update,
    uiStore.pixelsPerSecond,
    audioStore.audioReady,
    audioStore.wavesurfer,
  ]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const timeline = document.getElementById("timeline");
    const minimap = document.getElementById("minimap");
    const duration = audioStore.wavesurfer?.getDuration() ?? 0;
    if (!timeline || !minimap || duration <= 0) return;

    e.preventDefault();
    e.stopPropagation();

    const pointerId = e.pointerId;
    const startX = e.clientX;
    const startScrollLeft = timeline.scrollLeft;
    const minimapWidth = minimap.clientWidth;
    const target = e.currentTarget;
    target.setPointerCapture(pointerId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const deltaTime = (dx / minimapWidth) * duration;
      timeline.scrollLeft = startScrollLeft + deltaTime * uiStore.pixelsPerSecond;
    };

    const onPointerUp = () => {
      target.releasePointerCapture(pointerId);
      target.removeEventListener("pointermove", onPointerMove);
      target.removeEventListener("pointerup", onPointerUp);
      target.removeEventListener("pointercancel", onPointerUp);
    };

    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointerup", onPointerUp);
    target.addEventListener("pointercancel", onPointerUp);
  };

  if (!rect || rect.widthPct >= 99.5) return null;

  return (
    <Box
      position="absolute"
      top={0}
      left={`${rect.leftPct}%`}
      width={`${rect.widthPct}%`}
      height="100%"
      borderWidth="1px"
      borderColor="orange.300"
      bg="blackAlpha.400"
      boxSizing="border-box"
      pointerEvents="auto"
      cursor="grab"
      _active={{ cursor: "grabbing" }}
      zIndex={2}
      onPointerDown={onPointerDown}
      title="Drag to pan timeline"
    />
  );
});
