import { Box, HStack } from "@chakra-ui/react";
import { VariationGraph } from "@/src/components/VariationGraph/VariationGraph";
import { useEffect } from "react";
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

  return (
    // make variation graphs extend over the block border
    <Box position="relative" mx="-2px">
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
    </Box>
  );
});
