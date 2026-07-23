import { Box, HStack, Text } from "@chakra-ui/react";
import { VariationGraph } from "@/src/components/VariationGraph/VariationGraph";
import { MouseEvent as ReactMouseEvent, useEffect, useState } from "react";
import { Block } from "@/src/types/Block";
import { runInAction } from "mobx";
import { spanRegionsToBlock } from "@/src/utils/migrateVariations";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { RegionBoundary } from "@/src/components/ParameterVariations/RegionBoundary";
import { RegionInsertOverlay } from "@/src/components/ParameterVariations/RegionInsertOverlay";
import { InsertType } from "@/src/utils/regionConvert";
import { CurveVariation } from "@/src/types/Variations/CurveVariation";

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
};

// The parameter's curve(s) across the block, plus the region-manipulation layers
// that live on the lane body: draggable seam dividers (resize) and the armed
// insert overlay. Region controls (type/convert, min-max, LFO/Audio settings,
// reorder, reset, delete, ＋) live in the RegionBar above the lane.
export const ParameterVariations = observer(function ParameterVariations({
  uniformName,
  block,
  laneDuration,
  armedType = null,
  onInserted,
}: ParameterVariationsProps) {
  const store = useStore();
  const { uiStore } = store;
  const spanDuration = laneDuration ?? block.duration;
  const width = uiStore.timeToX(block.duration);
  const variations = block.parameterVariations[uniformName] ?? [];

  const domain: [number, number] = [0, 1];
  for (const variation of variations) {
    const [min, max] = variation.computeDomain();
    domain[0] = Math.min(domain[0], min);
    domain[1] = Math.max(domain[1], max);
  }
  // A Curve region may pin an explicit value range for the lane's vertical axis
  // (Min/Max control). When present it governs the axis — don't force-include the
  // default [0,1] — and lets nodes/handles be dragged into the headroom.
  const rangedCurves = variations.filter(
    (v): v is CurveVariation => v instanceof CurveVariation && v.hasExplicitRange,
  );
  if (rangedCurves.length) {
    domain[0] = Math.min(...rangedCurves.map((v) => v.rangeMin!));
    domain[1] = Math.max(...rangedCurves.map((v) => v.rangeMax!));
  }

  // Region model: the lane spans the block. When the block is resized, re-span
  // the regions to the new duration — extend the trailing region on grow,
  // truncate/drop it on shrink. (The lane never defines its own duration.)
  useEffect(() => {
    if (!store.curvesPreview) return;
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
  }, [store.curvesPreview, block, uniformName, spanDuration]);

  const multipleRegions = variations.length > 1;

  // Hover value cursor: a vertical line + readout that follows the mouse to any
  // x (not quantized to samples) and reports the param's value there via each
  // region's valueAtTime — works across all region types (curve/LFO/audio/...).
  const [cursorX, setCursorX] = useState<number | null>(null);
  let cursorValue: number | null = null;
  if (cursorX != null && variations.length) {
    const time = uiStore.xToTime(cursorX);
    let acc = 0;
    for (let i = 0; i < variations.length; i++) {
      const v = variations[i];
      if (time < acc + v.duration || i === variations.length - 1) {
        const local = Math.max(0, Math.min(v.duration, time - acc));
        const value = v.valueAtTime(local, block.startTime + time);
        if (typeof value === "number") cursorValue = value;
        break;
      }
      acc += v.duration;
    }
  }
  // dot y within the graph (its svg is 50px tall inside a 4px py box, 6px pad)
  const span = domain[1] - domain[0] || 1;
  const dotTop =
    cursorValue == null
      ? 0
      : Math.max(
          10,
          Math.min(48, 10 + (1 - (cursorValue - domain[0]) / span) * 38),
        );
  const labelNearRight = cursorX != null && cursorX > width - 44;

  return (
    // make variation graphs extend over the block border
    <Box
      position="relative"
      mx="-2px"
      onMouseMove={(e: ReactMouseEvent<HTMLDivElement>) =>
        setCursorX(e.clientX - e.currentTarget.getBoundingClientRect().left)
      }
      onMouseLeave={() => setCursorX(null)}
    >
      <HStack width="100%" justify="start" spacing={0}>
        {variations.map((variation) => (
          <VariationGraph
            key={variation.id}
            uniformName={uniformName}
            variation={variation}
            width={
              variation.duration < 0
                ? width
                : (variation.duration / block.duration) * width
            }
            domain={domain}
            block={block}
          />
        ))}
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

      {/* hover value cursor — line + dot + readout that track the mouse */}
      {cursorX != null && (
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
          {cursorValue != null && (
            <>
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
                {Number.isInteger(cursorValue)
                  ? cursorValue
                  : cursorValue.toFixed(2)}
              </Text>
            </>
          )}
        </Box>
      )}
    </Box>
  );
});
