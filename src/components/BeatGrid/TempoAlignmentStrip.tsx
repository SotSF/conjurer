import { observer } from "mobx-react-lite";
import { Box } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { useStore } from "@/src/types/StoreContext";

const WIDTH = 316;
const HEIGHT = 64;
// A window this narrow puts roughly 4ms in a pixel, which is the scale at
// which grid misalignment actually matters.
const HALF_WINDOW_SECONDS = 0.6;

/**
 * Waveform around the playhead with the beat grid drawn over it.
 *
 * The timeline is zoomed far too coarsely to judge whether a line sits on a
 * transient; this is the visual counterpart to the metronome, showing at a few
 * milliseconds per pixel whether the grid and the music agree.
 */
export const TempoAlignmentStrip = observer(function TempoAlignmentStrip() {
  const store = useStore();
  const { audioStore, beatGridStore } = store;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = WIDTH * ratio;
    canvas.height = HEIGHT * ratio;

    let frame = 0;

    // Driven by animation frames rather than MobX: globalTime changes 60 times
    // a second, and re-rendering the surrounding popover that often would be
    // wasteful when only this canvas cares.
    const draw = () => {
      frame = requestAnimationFrame(draw);

      const center = audioStore.globalTime;
      const pixelsPerSecond = WIDTH / (HALF_WINDOW_SECONDS * 2);
      const startTime = center - HALF_WINDOW_SECONDS;

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.fillStyle = "#1A202C";
      context.fillRect(0, 0, WIDTH, HEIGHT);

      context.fillStyle = "#63B3ED";
      for (let x = 0; x < WIDTH; x++) {
        const time = startTime + x / pixelsPerSecond;
        if (time < 0) continue;
        const amplitude = Math.min(1, Math.abs(audioStore.getPeakAtTime(time)));
        const barHeight = amplitude * (HEIGHT - 6);
        context.fillRect(x, (HEIGHT - barHeight) / 2, 1, Math.max(1, barHeight));
      }

      const { grid, divisionBeats } = beatGridStore;
      for (const line of grid.linesInRange(
        Math.max(0, startTime),
        startTime + HALF_WINDOW_SECONDS * 2,
        divisionBeats,
      )) {
        const x = Math.round((line.time - startTime) * pixelsPerSecond) + 0.5;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, HEIGHT);
        context.lineWidth = line.isBar ? 2 : 1;
        context.strokeStyle = line.isBar
          ? "rgba(246, 173, 85, 0.95)"
          : line.isBeat
            ? "rgba(246, 173, 85, 0.6)"
            : "rgba(246, 173, 85, 0.25)";
        context.stroke();
      }

      context.beginPath();
      context.moveTo(WIDTH / 2 + 0.5, 0);
      context.lineTo(WIDTH / 2 + 0.5, HEIGHT);
      context.lineWidth = 1;
      context.strokeStyle = "rgba(245, 101, 101, 0.9)";
      context.stroke();
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [audioStore, beatGridStore]);

  return (
    <Box borderRadius="md" overflow="hidden">
      <canvas
        ref={canvasRef}
        style={{ width: `${WIDTH}px`, height: `${HEIGHT}px`, display: "block" }}
      />
    </Box>
  );
});
