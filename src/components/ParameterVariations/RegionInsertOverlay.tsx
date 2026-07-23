import { Box } from "@chakra-ui/react";
import { useRef, useState } from "react";
import { Block } from "@/src/types/Block";
import { Variation } from "@/src/types/Variations/Variation";
import { CurveVariation } from "@/src/types/Variations/CurveVariation";
import { PeriodicVariation } from "@/src/types/Variations/PeriodicVariation";
import { AudioVariation } from "@/src/types/Variations/AudioVariation";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { PaletteVariation } from "@/src/params/palette/variation/PaletteVariation";
import { isPalette } from "@/src/params/palette/Palette";
import { isVector4 } from "@/src/utils/object";
import { Vector4 } from "three";
import { useStore } from "@/src/types/StoreContext";
import { InsertType } from "@/src/utils/regionConvert";
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
  const { uiStore, beatMapStore } = store;
  const ref = useRef<HTMLDivElement>(null);
  const [span, setSpan] = useState<{ x0: number; x1: number } | null>(null);

  const laneWidth = uiStore.timeToX(laneDuration);
  const param = block.pattern.params[uniformName];
  const defaultWidthSec = Math.min(1, laneDuration / 4);

  const snap = (t: number, ctrl: boolean) => {
    if (ctrl || !uiStore.snappingToBeatGrid) return t;
    return beatMapStore.beatMap.nearestBeatTime(block.startTime + t) - block.startTime;
  };

  // The lane's raw value at local time t (number / Palette / Vector4).
  const laneValueAt = (t: number): unknown => {
    const vs = block.parameterVariations[uniformName] ?? [];
    let acc = 0;
    for (const v of vs) {
      if (t < acc + v.duration) return v.valueAtTime(t - acc, block.startTime + t);
      acc += v.duration;
    }
    return param?.value;
  };

  const makeRegion = (duration: number, startT: number): Variation => {
    const seam = laneValueAt(startT);
    if (regionType === "palette") {
      const pal = isPalette(seam) ? seam : param?.value;
      return new PaletteVariation(duration, pal as never);
    }
    if (regionType === "color") {
      const v4 = isVector4(seam)
        ? seam
        : isVector4(param?.value)
          ? param!.value
          : new Vector4(1, 1, 1, 1);
      return new LinearVariation4(duration, v4, v4);
    }
    const lo = typeof param?.min === "number" ? param.min : 0;
    const hi = typeof param?.max === "number" ? param.max : 1;
    if (regionType === "lfo")
      return new PeriodicVariation(
        duration,
        "sine",
        (hi - lo) / 2,
        Math.min(1, duration),
        0,
        (hi + lo) / 2,
      );
    if (regionType === "audio")
      return new AudioVariation(duration, hi - lo || 1, lo, 0, store);
    // curve: flat at the lane's value where it's dropped (continuous seam)
    const seamNum = typeof seam === "number" ? seam : lo;
    return CurveVariation.flat(duration, seamNum);
  };

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
      let sT = snap(uiStore.xToTime(sPx), ev.ctrlKey);
      let eT =
        ePx - sPx < 4
          ? snap(sT + defaultWidthSec, ev.ctrlKey) // click → default width
          : snap(uiStore.xToTime(ePx), ev.ctrlKey);
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
