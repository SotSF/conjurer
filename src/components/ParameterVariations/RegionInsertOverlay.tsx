import { Box } from "@chakra-ui/react";
import { useRef, useState } from "react";
import { Block } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { useLaneTimeScale } from "@/src/components/ParameterVariations/LaneTimeScaleContext";
import { InsertType, makeRegionOfType } from "@/src/utils/regionConvert";
import { laneValueAt } from "@/src/utils/laneSpan";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";

export type { InsertType };

const TYPE_COLOR: Record<InsertType, string> = {
  curve: "#ed8936",
  lfo: "#66bb94",
  audio: "#63b3ed",
  palette: "#b794f4",
  color: "#f687b3",
};

type Props = {
  block: Block;
  uniformName: string;
  laneDuration: number;
  regionType: InsertType;
  onInserted: () => void;
};

// The armed insert layer: a full-lane overlay (only mounted while the ＋ affordance
// has armed a type) that suspends in-region editing and lets you PAINT the span
// for a new region (drag) or drop a default-width one (click). On release it
// carves the span out of the overlapped region(s) via Block.insertRegion and
// disarms. Beat-snapped unless Ctrl is held.
export const RegionInsertOverlay = observer(function RegionInsertOverlay({
  block,
  uniformName,
  laneDuration,
  regionType,
  onInserted,
}: Props) {
  const store = useStore();
  const { beatGridStore } = store;
  const scale = useLaneTimeScale();
  const ref = useRef<HTMLDivElement>(null);
  const [span, setSpan] = useState<{ x0: number; x1: number } | null>(null);

  const laneWidth = scale.timeToX(laneDuration);
  const param = block.pattern.params[uniformName];
  const defaultWidthSec = Math.min(1, laneDuration / 4);

  const snap = (t: number, ctrl: boolean) =>
    beatGridStore.snapTime(block.startTime + t, {
      freehand: ctrl,
      pixelsPerSecond: scale.timeToX(1),
    }) - block.startTime;

  const makeRegion = (duration: number, startT: number) =>
    makeRegionOfType(
      regionType,
      duration,
      laneValueAt(block, uniformName, startT),
      param,
      store,
    );

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x0 = e.clientX - rect.left;
    setSpan({ x0, x1: x0 });
    const move = (ev: PointerEvent) =>
      setSpan({ x0, x1: ev.clientX - rect.left });
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const x1 = ev.clientX - rect.left;
      const sPx = Math.min(x0, x1);
      const ePx = Math.max(x0, x1);
      let sT = snap(scale.xToTime(sPx), ev.ctrlKey);
      let eT =
        ePx - sPx < 4
          ? snap(sT + defaultWidthSec, ev.ctrlKey) // click → default width
          : snap(scale.xToTime(ePx), ev.ctrlKey);
      if (eT <= sT) eT = sT + defaultWidthSec;
      setSpan(null);
      runInAction(() =>
        block.insertRegion(uniformName, sT, eT, (d) => makeRegion(d, sT)),
      );
      onInserted();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <Box
      ref={ref}
      position="absolute"
      top={0}
      bottom={0}
      left={0}
      width={`${laneWidth}px`}
      zIndex={6}
      cursor="copy"
      background={`${TYPE_COLOR[regionType]}14`}
      onPointerDown={onPointerDown}
    >
      {span && (
        <Box
          position="absolute"
          top={0}
          bottom={0}
          left={`${Math.min(span.x0, span.x1)}px`}
          width={`${Math.max(2, Math.abs(span.x1 - span.x0))}px`}
          background={`${TYPE_COLOR[regionType]}33`}
          borderLeft={`1.5px dashed ${TYPE_COLOR[regionType]}`}
          borderRight={`1.5px dashed ${TYPE_COLOR[regionType]}`}
          pointerEvents="none"
        />
      )}
    </Box>
  );
});
