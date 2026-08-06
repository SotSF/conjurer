import { observer } from "mobx-react-lite";
import { Box } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { useStore } from "@/src/types/StoreContext";
import { TIMELINE_HEADER_WIDTH } from "@/src/types/UIStore";
import { MAX_TIME } from "@/src/utils/time";

// Below this spacing, lines stop reading as a grid and start reading as fill,
// so the renderer steps up to a coarser level rather than drawing mush.
const MIN_LINE_SPACING_PX = 7;

const BAR_STYLE = "rgba(0, 0, 0, 0.42)";
const BEAT_STYLE = "rgba(0, 0, 0, 0.2)";
const DIVISION_STYLE = "rgba(0, 0, 0, 0.09)";
const ANCHOR_STYLE = "rgba(192, 86, 33, 0.9)";

/**
 * Draws the beat grid across the timeline.
 *
 * Canvas rather than DOM nodes: at 30 minutes and high zoom a grid is tens of
 * thousands of lines, and it has to stay pixel-exact against block positions
 * for the alignment to be trustworthy. The canvas is only ever viewport-sized
 * — it sticks to the left edge of the scroll port and redraws the visible
 * window on scroll — so cost is independent of song length and zoom.
 */
export const BeatGridOverlay = observer(function BeatGridOverlay() {
  const store = useStore();
  const { uiStore, beatGridStore } = store;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { pixelsPerSecond } = uiStore;
  const { grid, showGrid, divisionBeats } = beatGridStore;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const timeline = document.getElementById("timeline");
    if (!canvas || !container || !timeline) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;

    const draw = () => {
      frame = 0;

      const width = timeline.clientWidth;
      const height = container.clientHeight;
      if (width <= 0 || height <= 0) return;

      const ratio = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(width * ratio)) {
        canvas.width = Math.round(width * ratio);
        canvas.style.width = `${width}px`;
      }
      if (canvas.height !== Math.round(height * ratio)) {
        canvas.height = Math.round(height * ratio);
        canvas.style.height = `${height}px`;
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      if (!showGrid) return;

      // Content x of a time is the sticky header width plus the zoomed offset;
      // subtracting scrollLeft puts it in the canvas's viewport coordinates.
      const scrollLeft = timeline.scrollLeft;
      const timeAtX = (x: number) =>
        (x + scrollLeft - TIMELINE_HEADER_WIDTH) / pixelsPerSecond;

      const startTime = Math.max(0, timeAtX(TIMELINE_HEADER_WIDTH));
      const endTime = Math.min(MAX_TIME, timeAtX(width));
      if (endTime <= startTime) return;

      // Coarsen until lines are far enough apart to be legible: requested
      // division, then bars, then powers of two bars.
      const secondsPerBeat = 60 / grid.bpmAt(startTime);
      let beatsPerLine = divisionBeats;
      const spacing = (beats: number) => beats * secondsPerBeat * pixelsPerSecond;
      if (spacing(beatsPerLine) < MIN_LINE_SPACING_PX)
        beatsPerLine = grid.beatsPerBar;
      while (spacing(beatsPerLine) < MIN_LINE_SPACING_PX && beatsPerLine < 1024)
        beatsPerLine *= 2;

      context.save();
      // Never paint under the sticky layer headers.
      context.beginPath();
      context.rect(
        TIMELINE_HEADER_WIDTH,
        0,
        Math.max(0, width - TIMELINE_HEADER_WIDTH),
        height,
      );
      context.clip();

      for (const line of grid.linesInRange(startTime, endTime, beatsPerLine)) {
        // Half-pixel offset keeps a 1px line on a pixel boundary instead of
        // smearing it across two.
        const x =
          Math.round(
            TIMELINE_HEADER_WIDTH + line.time * pixelsPerSecond - scrollLeft,
          ) + 0.5;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.lineWidth = 1;
        context.strokeStyle = line.isBar
          ? BAR_STYLE
          : line.isBeat
            ? BEAT_STYLE
            : DIVISION_STYLE;
        context.stroke();
      }

      // Anchors are the handles the tempo map pivots around, so they get their
      // own mark — without one, a multi-tempo grid is impossible to reason about.
      if (!grid.isConstant) {
        context.strokeStyle = ANCHOR_STYLE;
        context.lineWidth = 2;
        for (const anchor of grid.anchors) {
          if (anchor.time < startTime || anchor.time > endTime) continue;
          const x =
            TIMELINE_HEADER_WIDTH + anchor.time * pixelsPerSecond - scrollLeft;
          context.beginPath();
          context.moveTo(x, 0);
          context.lineTo(x, height);
          context.stroke();
        }
      }

      context.restore();
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    schedule();
    timeline.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // The stack grows as layers are added or param lanes open.
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(container);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      timeline.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      resizeObserver.disconnect();
    };
  }, [pixelsPerSecond, grid, showGrid, divisionBeats]);

  return (
    <Box
      ref={containerRef}
      position="absolute"
      top={0}
      bottom={0}
      left={0}
      width={uiStore.timeToXPixels(MAX_TIME)}
      pointerEvents="none"
      zIndex={1}
    >
      {/* Zero-width so it never affects layout, but sticky so it tracks the
          scroll port; the canvas inside is absolutely positioned and sized to
          the viewport. No overflow:hidden anywhere above it — that would make
          this element stick to the clipped box instead of the timeline. */}
      <Box position="sticky" left={0} top={0} width={0} height="100%">
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0, display: "block" }}
        />
      </Box>
    </Box>
  );
});
