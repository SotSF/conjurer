import { Box, HStack, Text } from "@chakra-ui/react";
import { VariationGraph } from "@/src/components/VariationGraph/VariationGraph";
import {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Block } from "@/src/types/Block";
import { runInAction } from "mobx";
import { spanRegionsToBlock } from "@/src/utils/migrateVariations";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { RegionBoundary } from "@/src/components/ParameterVariations/RegionBoundary";
import { RegionInsertOverlay } from "@/src/components/ParameterVariations/RegionInsertOverlay";
import { LaneSpanToolbar } from "@/src/components/ParameterVariations/LaneSpanToolbar";
import { useLaneTimeScale } from "@/src/components/ParameterVariations/LaneTimeScaleContext";
import { InsertType } from "@/src/utils/regionConvert";
import { CurveVariation } from "@/src/types/Variations/CurveVariation";
import { laneRegions, laneSnapTargets } from "@/src/utils/laneSpan";
import {
  paramHasExplicitStep,
  resolveParamStep,
  snapValueToStep,
} from "@/src/utils/paramStep";

// pointer travel (px) that turns a click on the lane into a span drag
const SPAN_DRAG_THRESHOLD_PX = 4;
// how close (px) a span edge must come to a node/seam to snap onto it
const SPAN_SNAP_PX = 6;
// default EnvelopeGraph height; detail panel passes a taller value
const DEFAULT_GRAPH_HEIGHT = 50;
const GRAPH_PADDING = 6;

type ParameterVariationsProps = {
  uniformName: string;
  block: Block;
  // The duration the lane spans. For effect-block params this is the PARENT
  // pattern block's duration (effect blocks carry a placeholder duration);
  // defaults to the block's own duration.
  laneDuration?: number;
  // Region insert, armed from the RegionBar's ＋ (state lives in AutomationLane);
  // while set, the insert overlay captures paint/click on the lane.
  armedType?: InsertType | null;
  onInserted?: () => void;
  /** SVG / chart height for curve editors (taller in the detail panel). */
  graphHeight?: number;
};

// The parameter's curve(s) across the block, plus the region-manipulation layers
// that live on the lane body: draggable seam dividers (resize) and the armed
// insert overlay. Region controls (type/convert, min-max, LFO/Audio settings,
// reorder, reset, delete) live in the RegionBar above the lane; the lane-level
// ＋ lives in the name row above that.
export const ParameterVariations = observer(function ParameterVariations({
  uniformName,
  block,
  laneDuration,
  armedType = null,
  onInserted,
  graphHeight = DEFAULT_GRAPH_HEIGHT,
}: ParameterVariationsProps) {
  const store = useStore();
  const { beatGridStore } = store;
  const scale = useLaneTimeScale();
  const spanDuration = laneDuration ?? block.duration;
  const width = scale.timeToX(spanDuration);
  const variations = block.parameterVariations[uniformName] ?? [];
  const param = block.pattern.params[uniformName];

  // Baseline the vertical axis on the param's declared min/max (e.g. Count
  // 1…20). Fall back to [0, 1] when the param has no bounds — same default the
  // rest of the editor uses for unit-range values. Then expand to fit any
  // authored node extents that sit outside those bounds.
  const domain: [number, number] = [
    typeof param?.min === "number" ? param.min : 0,
    typeof param?.max === "number" ? param.max : 1,
  ];
  for (const variation of variations) {
    const [min, max] = variation.computeDomain();
    domain[0] = Math.min(domain[0], min);
    domain[1] = Math.max(domain[1], max);
  }
  // A Curve region may pin an explicit value range for the lane's vertical axis
  // (Min/Max control). When present it governs the axis — don't force-include the
  // param/default baseline — and lets nodes/handles be dragged into the headroom.
  const rangedCurves = variations.filter(
    (v): v is CurveVariation =>
      v instanceof CurveVariation && v.hasExplicitRange,
  );
  if (rangedCurves.length) {
    domain[0] = Math.min(...rangedCurves.map((v) => v.rangeMin!));
    domain[1] = Math.max(...rangedCurves.map((v) => v.rangeMax!));
  }

  // Region model: the lane spans the block. When the block is resized, re-span
  // the regions to the new duration — extend the trailing region on grow,
  // truncate/drop it on shrink. (The lane never defines its own duration.)
  useEffect(() => {
    const regions = block.parameterVariations[uniformName];
    if (!regions || regions.length === 0) return;
    const total = regions.reduce((sum, v) => sum + (v.duration || 0), 0);
    if (Math.abs(total - spanDuration) < 1e-6) return; // already spans the lane
    runInAction(() => {
      const param = block.pattern.params[uniformName];
      const defaultValue = typeof param?.value === "number" ? param.value : 0;
      block.parameterVariations[uniformName] = spanRegionsToBlock(
        regions,
        spanDuration,
        defaultValue,
      );
      block.triggerVariationReactions(uniformName);
    });
  }, [block, uniformName, spanDuration]);

  const multipleRegions = variations.length > 1;

  // ===== time-span selection =====

  const containerRef = useRef<HTMLDivElement>(null);
  const laneSpan =
    store.laneSpan?.block === block &&
    store.laneSpan?.uniformName === uniformName
      ? store.laneSpan
      : null;

  // Pull a span edge onto the nearest node/seam, then the beat grid. Snapping to
  // curve nodes is what makes it practical to grab exactly one hump of a curve.
  const snapSpanTime = (time: number, freehand: boolean) => {
    if (freehand) return time;
    const x = scale.timeToX(time);
    let nearest: number | null = null;
    let nearestDistance = SPAN_SNAP_PX;
    for (const target of laneSnapTargets(block, uniformName)) {
      const distance = Math.abs(scale.timeToX(target) - x);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = target;
      }
    }
    if (nearest != null) return nearest;
    return (
      beatGridStore.snapTime(block.startTime + time, {
        pixelsPerSecond: scale.timeToX(1),
      }) - block.startTime
    );
  };

  // Drag across the lane to select a time span — the same gesture that paints a
  // new region. Only pointer-downs that reach the lane get here (curve nodes,
  // handles, region seams and the insert overlay all stop propagation first),
  // and it only becomes a selection once the pointer has actually travelled, so
  // a plain click still falls through to the curve's own segment pick.
  const onLanePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (armedType || e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const startClientX = e.clientX;
    const x0 = e.clientX - rect.left;
    let dragged = false;

    const move = (ev: PointerEvent) => {
      if (
        !dragged &&
        Math.abs(ev.clientX - startClientX) < SPAN_DRAG_THRESHOLD_PX
      )
        return;
      dragged = true;
      const x1 = ev.clientX - rect.left;
      runInAction(() =>
        store.selectLaneSpan(
          block,
          uniformName,
          snapSpanTime(scale.xToTime(Math.min(x0, x1)), ev.ctrlKey),
          snapSpanTime(scale.xToTime(Math.max(x0, x1)), ev.ctrlKey),
        ),
      );
    };

    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (dragged) {
        // a drag is not a click: swallow the click that follows it so it can't
        // also open an LFO/Audio settings popover or re-pick a curve segment
        const swallowClick = (click: MouseEvent) => {
          click.stopPropagation();
          click.preventDefault();
        };
        window.addEventListener("click", swallowClick, {
          capture: true,
          once: true,
        });
        // a drag released outside the window never produces that click, so
        // don't leave the guard armed to eat an unrelated one later
        window.setTimeout(
          () =>
            window.removeEventListener("click", swallowClick, {
              capture: true,
            }),
          0,
        );
        return;
      }
      // click selects the whole region; Curve regions handle their own
      // node/segment clicks for partial picks (drag still spans any type)
      const time = scale.xToTime(ev.clientX - rect.left);
      const region = laneRegions(block, uniformName).find(
        (r) => time < r.endTime,
      );
      if (region && !(region.variation instanceof CurveVariation))
        runInAction(() =>
          store.selectLaneSpan(
            block,
            uniformName,
            region.startTime,
            region.endTime,
          ),
        );
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // Hover value cursor: a vertical line + readout that follows the mouse to any
  // x (not quantized to samples) and reports the param's value there via each
  // region's valueAtTime — works across all region types (curve/LFO/audio/...).
  // Params with an explicit step (Segments, Bars, …) snap the *displayed*
  // cursor onto that grid so the UI never suggests off-step placements. The
  // underlying curve / shader sample is left continuous.
  const snapHover = paramHasExplicitStep(block, uniformName);
  const valueStep = resolveParamStep(block, uniformName);
  const [cursorX, setCursorX] = useState<number | null>(null);
  let cursorValue: number | null = null;
  if (cursorX != null && variations.length) {
    const time = scale.xToTime(cursorX);
    let acc = 0;
    for (let i = 0; i < variations.length; i++) {
      const v = variations[i];
      if (time < acc + v.duration || i === variations.length - 1) {
        const local = Math.max(0, Math.min(v.duration, time - acc));
        const value = v.valueAtTime(local, block.startTime + time);
        if (typeof value === "number")
          cursorValue = snapHover
            ? snapValueToStep(
                value,
                valueStep,
                typeof param?.min === "number" ? param.min : undefined,
                typeof param?.max === "number" ? param.max : undefined,
              )
            : value;
        break;
      }
      acc += v.duration;
    }
  }
  // dot y within the graph (svg height + padding mapped to value domain)
  const span = domain[1] - domain[0] || 1;
  const drawable = graphHeight - 2 * GRAPH_PADDING;
  const dotTop =
    cursorValue == null
      ? 0
      : Math.max(
          GRAPH_PADDING,
          Math.min(
            graphHeight - GRAPH_PADDING,
            GRAPH_PADDING +
              (1 - (cursorValue - domain[0]) / span) * drawable,
          ),
        );
  const labelNearRight = cursorX != null && cursorX > width - 44;

  return (
    // make variation graphs extend over the block border
    <Box
      ref={containerRef}
      position="relative"
      mx="-2px"
      onPointerDown={onLanePointerDown}
      onMouseMove={(e: ReactMouseEvent<HTMLDivElement>) =>
        setCursorX(e.clientX - e.currentTarget.getBoundingClientRect().left)
      }
      onMouseLeave={() => setCursorX(null)}
    >
      <HStack width="100%" justify="start" spacing={0}>
        {laneRegions(block, uniformName).map(({ variation, startTime }) => {
          // Each region occupies a slot proportional to its duration. Wrap the
          // graph in a fixed-width, non-shrinking slot so regions tile to the
          // full lane width and align with the region tabs / RegionBoundary
          // seams and the lane-span selection overlay above.
          const slotWidth =
            variation.duration < 0
              ? width
              : (variation.duration / spanDuration) * width;
          return (
            <Box key={variation.id} width={`${slotWidth}px`} flexShrink={0} minW={0}>
              <VariationGraph
                uniformName={uniformName}
                variation={variation}
                width={slotWidth}
                domain={domain}
                block={block}
                laneStartTime={startTime}
                laneSpan={laneSpan}
                graphHeight={graphHeight}
              />
            </Box>
          );
        })}
      </HStack>

      {/* draggable dividers at each internal region seam (resize by moving the
          boundary; left grows as right shrinks, lane stays full) */}
      {multipleRegions &&
        variations
          .slice(0, -1)
          .map((variation, i) => (
            <RegionBoundary
              key={`boundary-${variation.id}`}
              block={block}
              uniformName={uniformName}
              index={i}
            />
          ))}

      {/* the selected time span: a highlighted window over the lane, plus the
          floating toolbar that acts on it */}
      {laneSpan && (
        <>
          <Box
            position="absolute"
            top={0}
            bottom={0}
            left={`${scale.timeToX(laneSpan.startTime)}px`}
            width={`${Math.max(
              2,
              scale.timeToX(laneSpan.endTime - laneSpan.startTime),
            )}px`}
            bg="#63b3ed26"
            borderLeft="1.5px solid #63b3ed"
            borderRight="1.5px solid #63b3ed"
            pointerEvents="none"
            zIndex={5}
          />
          <LaneSpanToolbar
            block={block}
            uniformName={uniformName}
            laneRef={containerRef}
          />
        </>
      )}

      {/* armed insert layer: paint/click the lane to place the new region */}
      {armedType && (
        <RegionInsertOverlay
          block={block}
          uniformName={uniformName}
          laneDuration={spanDuration}
          regionType={armedType}
          onInserted={() => onInserted?.()}
        />
      )}

      {/* hover value cursor — line + dot + readout that track the mouse. Only
          shown when there's a numeric value here, so it never appears on palette
          or color lanes (no meaningful value-over-time within a region). */}
      {cursorX != null && cursorValue != null && (
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          pointerEvents="none"
          zIndex={4}
        >
          <Box
            position="absolute"
            top={0}
            bottom={0}
            left={`${cursorX}px`}
            width="1px"
            bg="whiteAlpha.700"
          />
          <Box
            position="absolute"
            left={`${cursorX - 3}px`}
            top={`${dotTop - 3}px`}
            boxSize="6px"
            borderRadius="full"
            bg="gray.800"
            border="2px solid"
            borderColor="orange.400"
          />
          <Text
            position="absolute"
            top="1px"
            left={`${cursorX + (labelNearRight ? -6 : 6)}px`}
            transform={labelNearRight ? "translateX(-100%)" : undefined}
            fontSize="11px"
            fontWeight={600}
            color="white"
            whiteSpace="nowrap"
            textShadow="0 1px 2px rgba(0,0,0,.85)"
          >
            {Number.isInteger(cursorValue) ? cursorValue : cursorValue.toFixed(2)}
          </Text>
        </Box>
      )}
    </Box>
  );
});
