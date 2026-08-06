import { Box } from "@chakra-ui/react";
import { Block } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { useLaneTimeScale } from "@/src/components/ParameterVariations/LaneTimeScaleContext";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { hoverHelpProps } from "@/src/utils/hoverHelp";

// Cumulative lane time at the boundary AFTER region `index` (i.e. the seam
// between region `index` and `index + 1`).
const boundaryTime = (block: Block, uniformName: string, index: number) =>
  (block.parameterVariations[uniformName] ?? [])
    .slice(0, index + 1)
    .reduce((sum, v) => sum + v.duration, 0);

type Props = {
  block: Block;
  uniformName: string;
  index: number;
};

// A draggable divider at a region seam. Dragging moves the boundary in time —
// the left region grows exactly as the right shrinks (Block.moveBoundary keeps
// the lane full). Beat-snapped by default; hold Ctrl for freehand. Each move is
// applied from a drag-start SNAPSHOT of the two neighbors, so trimming a Curve
// and dragging back within one drag never loses content.
export const RegionBoundary = observer(function RegionBoundary({
  block,
  uniformName,
  index,
}: Props) {
  const { uiStore, beatGridStore } = useStore();
  const scale = useLaneTimeScale();
  const x = scale.timeToX(boundaryTime(block, uniformName, index));

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const vs = block.parameterVariations[uniformName];
    if (!vs || index + 1 >= vs.length) return;
    const origLeft = vs[index].clone();
    const origRight = vs[index + 1].clone();
    const origBoundary = boundaryTime(block, uniformName, index);

    const cursorStyle = document.createElement("style");
    cursorStyle.textContent = "*{cursor:col-resize !important;}";
    document.head.appendChild(cursorStyle);

    const move = (ev: PointerEvent) => {
      const dragged = origBoundary + scale.xToTime(ev.clientX - startX);
      const target =
        beatGridStore.snapTime(block.startTime + dragged, {
          freehand: ev.ctrlKey,
          pixelsPerSecond: scale.timeToX(1),
        }) - block.startTime;
      runInAction(() => {
        const cur = block.parameterVariations[uniformName];
        if (!cur) return;
        // restore the two neighbors to their drag-start state, then apply the
        // full delta once (non-lossy for Curve trims)
        cur[index] = origLeft.clone();
        cur[index + 1] = origRight.clone();
        block.moveBoundary(uniformName, index, target - origBoundary);
      });
    };
    const up = () => {
      cursorStyle.remove();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // One shared hit target per seam (not a per-region end handle). Sits above
  // the lane graphs so curve endpoint nodes at the same x don't steal the drag.
  return (
    <Box
      position="absolute"
      top={0}
      bottom={0}
      left={`${x - 3}px`}
      width="6px"
      zIndex={5}
      cursor="col-resize"
      role="separator"
      aria-orientation="vertical"
      onPointerDown={onPointerDown}
      _hover={{ "& > div": { opacity: 1, background: "#8fcbf5" } }}
      {...hoverHelpProps(
        uiStore,
        "Region boundary",
        "Drag to retime the seam between neighboring regions. Hold ⌃ for freehand (no beat snap).",
      )}
    >
      {/* the visible seam line, faint until hovered */}
      <Box
        position="absolute"
        left="2px"
        top={0}
        bottom={0}
        width="2px"
        background="#4a5568"
        opacity={0.55}
        transition="opacity 0.12s, background 0.12s"
        pointerEvents="none"
      />
    </Box>
  );
});
