import { Block } from "@/src/types/Block";
import { Variation } from "@/src/types/Variations/Variation";
import { ParameterVariations } from "@/src/components/ParameterVariations/ParameterVariations";
import { sampleBlockOpacity } from "@/src/utils/blockOpacity";
import { paramValueAtTime } from "@/src/utils/paramValueAtTime";
import { reorder } from "@/src/utils/array";
import { useStore } from "@/src/types/StoreContext";
import {
  Box,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  VStack,
} from "@chakra-ui/react";
import { TIMELINE_HEADER_WIDTH } from "@/src/types/UIStore";
import {
  DragDropContext,
  Draggable,
  Droppable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { MouseEvent as ReactMouseEvent, useEffect, useState } from "react";
import { AddRegionMenu } from "@/src/components/ParameterVariations/AddRegionMenu";
import { CurveRangeControl } from "@/src/components/ParameterVariations/CurveRangeControl";
import { RegionSettingsPopover } from "@/src/components/ParameterVariations/RegionSettingsPopover";
import { CurveVariation } from "@/src/types/Variations/CurveVariation";
import { PeriodicVariation } from "@/src/types/Variations/PeriodicVariation";
import { AudioVariation } from "@/src/types/Variations/AudioVariation";
import {
  allowedInsertTypes,
  convertRegion,
  InsertType,
  regionTypeOf,
  RegionType,
} from "@/src/utils/regionConvert";

const OPACITY_CURVE_HEIGHT = 26;
const REGION_BAR_HEIGHT = 18;
// below this rendered width a region tab collapses to just its colored segment,
// revealing its full header (over neighbors) only when that region is hovered
const NARROW_TAB_PX = 84;

// A region's modulation type → its label, accent color, and an opaque tab
// background (opaque so an earlier tab never shows through a later one).
const regionTypeStyle = (
  variation: Variation,
): { label: string; color: string; bg: string } => {
  switch (variation.type) {
    case "periodic":
      return { label: "LFO", color: "#66bb94", bg: "#17251e" };
    case "audio":
      return { label: "AUDIO", color: "#63b3ed", bg: "#16202b" };
    case "palette":
      return { label: "PALETTE", color: "#b794f4", bg: "#221b2e" };
    case "linear4":
      return { label: "COLOR", color: "#f6ad55", bg: "#2a2216" };
    default:
      // flat / linear / easing / spline all read as a drawn curve
      return { label: "CURVE", color: "#ed8936", bg: "#2a2018" };
  }
};

type Lane = {
  // the block the param lives on (the pattern block, or one of its effects)
  ownerBlock: Block;
  uniformName: string;
  label: string;
  isOpacity: boolean;
  // Duration the lane spans: always the parent pattern block's duration (effect
  // blocks carry a placeholder duration, so their param lanes must use this).
  laneDuration: number;
};

// The parameters whose automation lanes are open beneath a block, gathered from
// the pattern block and each of its effect blocks. Iterating params in
// declaration order (rather than arm order) keeps lanes in the same order as
// the dot-row, so a newly-armed lane slots into place instead of appending.
const gatherLanes = (block: Block): Lane[] => {
  const lanes: Lane[] = [];
  for (const [uniformName, param] of Object.entries(block.pattern.params)) {
    if (!block.lanedParams.has(uniformName)) continue;
    lanes.push({
      ownerBlock: block,
      uniformName,
      label: param.name,
      isOpacity: uniformName === "u_opacity",
      laneDuration: block.duration,
    });
  }
  for (const effectBlock of block.effectBlocks) {
    for (const [uniformName, param] of Object.entries(
      effectBlock.pattern.params,
    )) {
      if (!effectBlock.lanedParams.has(uniformName)) continue;
      lanes.push({
        ownerBlock: effectBlock,
        uniformName,
        label: `${effectBlock.pattern.name} · ${param.name}`,
        isOpacity: false,
        laneDuration: block.duration,
      });
    }
  }
  return lanes;
};

// Automation lanes rendered directly beneath a block, spanning only the block's
// width. Each lane is just its curve + a pinned name at rest; a per-region
// control bar reveals in the strip above the curve on hover (never over it).
export const BlockAutomationLanes = observer(function BlockAutomationLanes({
  block,
}: {
  block: Block;
}) {
  const lanes = gatherLanes(block);
  if (lanes.length === 0) return null;

  return (
    <VStack
      spacing={0}
      width="100%"
      align="stretch"
      py={1}
      borderLeftWidth="2px"
      borderColor="blue.500"
      bg="#12161f"
    >
      {lanes.map((lane) => (
        <AutomationLane
          key={`${lane.ownerBlock.id}:${lane.uniformName}`}
          lane={lane}
        />
      ))}
    </VStack>
  );
});

const AutomationLane = observer(function AutomationLane({
  lane,
}: {
  lane: Lane;
}) {
  const { ownerBlock, uniformName, label, isOpacity } = lane;
  const { uiStore } = useStore();
  // the region under the cursor, mapped from mouse X, so hovering anywhere in
  // the lane lifts that region's header to front
  const [curveRegionId, setCurveRegionId] = useState<string | null>(null);
  // the region whose header the cursor is directly over; takes precedence so a
  // header that overflows onto a neighbor stays reachable (its buttons don't
  // get covered when the cursor crosses into the neighbor's X)
  const [headerRegionId, setHeaderRegionId] = useState<string | null>(null);
  const hoveredRegionId = headerRegionId ?? curveRegionId;

  // Region insert: the RegionBar ＋ arms a one-shot insert of a chosen type
  // (gated to the param's sensible types); the insert overlay in the lane body
  // then captures paint/click. Esc cancels. Not offered on the opacity lane.
  const insertTypes = isOpacity
    ? []
    : allowedInsertTypes(ownerBlock.pattern.params[uniformName]);
  const [armedType, setArmedType] = useState<InsertType | null>(null);
  useEffect(() => {
    if (!armedType) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setArmedType(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [armedType]);

  const onMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const variations = ownerBlock.parameterVariations[uniformName];
    if (!variations || variations.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const time = uiStore.xToTime(e.clientX - rect.left);
    let acc = 0;
    for (const variation of variations) {
      if (time < acc + variation.duration) {
        if (curveRegionId !== variation.id) setCurveRegionId(variation.id);
        return;
      }
      acc += variation.duration;
    }
    const last = variations[variations.length - 1];
    if (last && curveRegionId !== last.id) setCurveRegionId(last.id);
  };

  return (
    <Box position="relative" width="100%" role="group">
      {/* the curve, with the pinned param name overlaid top-left */}
      <Box
        position="relative"
        width="100%"
        onMouseMove={onMouseMove}
        onMouseLeave={() => setCurveRegionId(null)}
      >
        {isOpacity ? (
          <OpacityLaneBody block={ownerBlock} />
        ) : (
          <ParameterVariations
            uniformName={uniformName}
            block={ownerBlock}
            laneDuration={lane.laneDuration}
            armedType={armedType}
            onInserted={() => setArmedType(null)}
          />
        )}

        {/* region control bar — nothing at rest (lanes stay flush); on hover (or
            while an insert is armed) it floats just above the curve, so it never
            covers a node and costs no vertical space. The ＋ sits at the right. */}
        <Box
          position="absolute"
          bottom="100%"
          left={0}
          width="100%"
          zIndex={5}
          opacity={armedType ? 1 : 0}
          pointerEvents={armedType ? "auto" : "none"}
          transition="opacity 0.12s"
          _groupHover={{ opacity: 1, pointerEvents: "auto" }}
        >
          <Box position="relative" width="100%">
            <RegionBar
              block={ownerBlock}
              uniformName={uniformName}
              isOpacity={isOpacity}
              hoveredRegionId={hoveredRegionId}
              setHeaderRegionId={setHeaderRegionId}
            />
            {insertTypes.length > 0 && (
              <Box position="absolute" top="0" right="2px" zIndex={30}>
                <AddRegionMenu
                  types={insertTypes}
                  armedType={armedType}
                  setArmedType={setArmedType}
                />
              </Box>
            )}
          </Box>
        </Box>

        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          zIndex={3}
          pointerEvents="none"
        >
          <Box
            position="sticky"
            left={`${TIMELINE_HEADER_WIDTH}px`}
            width="fit-content"
            opacity={0.9}
            transition="opacity 0.12s"
            _groupHover={{ opacity: 0.4 }}
          >
            <HStack
              spacing={1.5}
              align="baseline"
              bg="rgba(15,17,21,.6)"
              borderBottomRightRadius="4px"
              px="5px"
              py="1px"
            >
              <Text
                fontSize="10px"
                fontWeight={600}
                color="#ed8936"
                whiteSpace="nowrap"
              >
                {label}
              </Text>
              <LaneValueReadout block={ownerBlock} uniformName={uniformName} />
            </HStack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

// The control bar above a lane: one tab per region, sized to the region's
// width (so the bar doubles as a region map). Quiet at rest (colored accents
// only); type label + reorder/reset/delete reveal on lane hover.
const RegionBar = observer(function RegionBar({
  block,
  uniformName,
  isOpacity,
  hoveredRegionId,
  setHeaderRegionId,
}: {
  block: Block;
  uniformName: string;
  isOpacity: boolean;
  hoveredRegionId: string | null;
  setHeaderRegionId: (id: string | null) => void;
}) {
  const variations = block.parameterVariations[uniformName] ?? [];

  // opacity in auto mode has no regions — its bar is a single AUTO tab that
  // materializes into an editable curve
  if (isOpacity && !block.hasManualOpacity)
    return (
      <HStack
        position="relative"
        height={`${REGION_BAR_HEIGHT}px`}
        width="100%"
        spacing={0}
        px="8px"
        borderTopWidth="2px"
        borderColor="#3182ce"
        borderTopRadius="6px"
        bg="#141c26"
        boxShadow="0 -2px 10px rgba(0,0,0,.4)"
        align="center"
      >
        <Text
          position="sticky"
          left={`${TIMELINE_HEADER_WIDTH}px`}
          fontSize="9px"
          fontWeight={700}
          color="#8fcbf5"
          flexShrink={0}
        >
          AUTO
        </Text>
        <Box flex="1" minW={0} />
        <Button
          position="sticky"
          right="0"
          size="xs"
          height="14px"
          fontSize="9px"
          variant="ghost"
          flexShrink={0}
          onClick={action((e: ReactMouseEvent) => {
            e.stopPropagation();
            block.materializeAutoOpacity();
          })}
        >
          Customize
        </Button>
      </HStack>
    );

  if (variations.length === 0) return null;

  const multiple = variations.length > 1;
  const onDragEnd: OnDragEndResponder = action((result) => {
    if (!result.destination) return;
    block.parameterVariations[uniformName] = reorder(
      variations,
      result.source.index,
      result.destination.index,
    );
  });

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={`bar-${block.id}-${uniformName}`} direction="horizontal">
        {(provided) => (
          <HStack
            ref={provided.innerRef}
            {...provided.droppableProps}
            height={`${REGION_BAR_HEIGHT}px`}
            width="100%"
            spacing={0}
            align="stretch"
            bg="#161d28"
            boxShadow="0 -2px 10px rgba(0,0,0,.4)"
            borderTopRadius="6px"
          >
            {variations.map((variation, index) => (
              <Draggable
                key={variation.id}
                draggableId={variation.id}
                index={index}
                isDragDisabled={!multiple}
              >
                {(prov) => (
                  <Box
                    ref={prov.innerRef}
                    {...prov.draggableProps}
                    width={`${(variation.duration / block.duration) * 100}%`}
                    minW={0}
                    position="relative"
                    zIndex={variation.id === hoveredRegionId ? 20 : undefined}
                  >
                    <RegionTab
                      block={block}
                      uniformName={uniformName}
                      variation={variation}
                      multiple={multiple}
                      dragHandleProps={prov.dragHandleProps}
                      setHeaderRegionId={setHeaderRegionId}
                    />
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </HStack>
        )}
      </Droppable>
    </DragDropContext>
  );
});

const RegionTab = observer(function RegionTab({
  block,
  uniformName,
  variation,
  multiple,
  dragHandleProps,
  setHeaderRegionId,
}: {
  block: Block;
  uniformName: string;
  variation: Variation;
  multiple: boolean;
  dragHandleProps: any;
  setHeaderRegionId: (id: string | null) => void;
}) {
  const store = useStore();
  const { uiStore } = store;
  const { label, color, bg } = regionTypeStyle(variation);
  const narrow = uiStore.timeToX(variation.duration) < NARROW_TAB_PX;

  // keep this region's header active (front + reachable) while the cursor is
  // over it, even if it overflows onto a neighbor's X
  const headerHover = {
    onMouseEnter: () => setHeaderRegionId(variation.id),
    onMouseLeave: () => setHeaderRegionId(null),
  };

  const dragHandle = multiple ? (
    <Box {...dragHandleProps} cursor="grab" color="#8a97a8" fontSize="10px" flexShrink={0}>
      ⠿
    </Box>
  ) : null;
  const typeLabelText = (
    <Text
      fontSize="9px"
      fontWeight={700}
      letterSpacing="0.02em"
      color={color}
      noOfLines={1}
    >
      {label}
    </Text>
  );
  // the type label doubles as a convert menu for scalar regions; color regions
  // (palette / linear4) aren't convertible so it stays a plain label
  const current = regionTypeOf(variation);
  const convertTargets =
    current === "other"
      ? []
      : (["curve", "lfo", "audio"] as RegionType[]).filter((t) => t !== current);
  const typeLabel =
    convertTargets.length === 0 ? (
      typeLabelText
    ) : (
      <Menu isLazy placement="bottom-start">
        <MenuButton
          onClick={(e) => e.stopPropagation()}
          title="Convert region type"
          style={{ cursor: "pointer" }}
        >
          {typeLabelText}
        </MenuButton>
        <MenuList minW="140px" bg="gray.700" py={1}>
          {convertTargets.map((t) => (
            <MenuItem
              key={t}
              fontSize={11}
              bg="gray.700"
              _hover={{ bg: "gray.600" }}
              onClick={action((e: ReactMouseEvent) => {
                e.stopPropagation();
                const replacement = convertRegion(
                  variation,
                  t,
                  store,
                  block.pattern.params[uniformName],
                  block.startTime,
                );
                block.replaceRegionInPlace(uniformName, variation, replacement);
              })}
            >
              Convert to {t === "lfo" ? "LFO" : t[0].toUpperCase() + t.slice(1)}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    );

  // per-type settings (gear): Curve → Min/Max range; LFO/Audio → rate/etc.
  const settings =
    variation instanceof CurveVariation ? (
      <CurveRangeControl
        block={block}
        uniformName={uniformName}
        variation={variation}
      />
    ) : variation instanceof PeriodicVariation ||
      variation instanceof AudioVariation ? (
      <RegionSettingsPopover
        block={block}
        uniformName={uniformName}
        variation={variation}
      />
    ) : null;

  const controls = (
    <HStack spacing="6px" flexShrink={0} color="#c3cdda" fontSize="11px">
      {settings}
      <Box
        as="span"
        cursor="pointer"
        title="Reset region to default"
        _hover={{ color: "#63b3ed" }}
        onClick={action((e: ReactMouseEvent) => {
          e.stopPropagation();
          block.resetVariationToDefault(uniformName, variation);
        })}
      >
        ↺
      </Box>
      {multiple && (
        <Box
          as="span"
          cursor="pointer"
          title="Delete region"
          _hover={{ color: "#fc8181" }}
          onClick={action((e: ReactMouseEvent) => {
            e.stopPropagation();
            store.deleteVariation(block, uniformName, variation);
          })}
        >
          ✕
        </Box>
      )}
    </HStack>
  );

  // narrow: the tab is just a colored segment, but its full header renders as an
  // overflow to the right (opaque, so the next tab covers it unless this one is
  // hovered, which lifts it via the wrapper's z-index). top:-2px so the header's
  // top border lines up with the bar's, not 2px below the tab's own border.
  if (narrow)
    return (
      <Box
        position="relative"
        height="100%"
        borderTopWidth="2px"
        borderColor={color}
        bg={bg}
      >
        <HStack
          position="absolute"
          top="-2px"
          left={0}
          height={`${REGION_BAR_HEIGHT}px`}
          width="max-content"
          spacing="5px"
          px="6px"
          bg={bg}
          borderTopWidth="2px"
          borderColor={color}
          {...headerHover}
        >
          {dragHandle}
          {typeLabel}
          {controls}
        </HStack>
      </Box>
    );

  // wide: label pinned to the left of the view, controls to the right, so they
  // survive horizontal scroll; opaque so nothing shows through
  return (
    <HStack
      position="relative"
      height="100%"
      spacing={0}
      px="6px"
      borderTopWidth="2px"
      borderColor={color}
      bg={bg}
      align="center"
      {...headerHover}
    >
      <HStack
        position="sticky"
        left={`${TIMELINE_HEADER_WIDTH}px`}
        spacing="5px"
        flexShrink={0}
        zIndex={1}
        bg={bg}
      >
        {dragHandle}
        {typeLabel}
      </HStack>
      <Box flex="1" minW={0} />
      <HStack position="sticky" right="0" flexShrink={0} zIndex={1} bg={bg} pl="4px">
        {controls}
      </HStack>
    </HStack>
  );
});

const formatLaneValue = (n: number) =>
  Number.isInteger(n) ? String(n) : parseFloat(n.toFixed(3)).toString();

// The param's value at the current playhead time, shown next to the lane label
// (clamped to the block edges when the playhead is outside the block). Observer
// so it tracks the playhead live.
const LaneValueReadout = observer(function LaneValueReadout({
  block,
  uniformName,
}: {
  block: Block;
  uniformName: string;
}) {
  const { audioStore } = useStore();
  const value = paramValueAtTime(block, uniformName, audioStore.globalTime);
  if (typeof value !== "number") return null;
  return (
    <Text fontFamily="mono" fontSize="9px" color="#a0aec0">
      {formatLaneValue(value)}
    </Text>
  );
});

const OpacityLaneBody = observer(function OpacityLaneBody({
  block,
}: {
  block: Block;
}) {
  const { uiStore } = useStore();

  if (block.hasManualOpacity)
    return <ParameterVariations uniformName="u_opacity" block={block} />;

  const width = uiStore.timeToX(block.duration);
  return <OpacityAutoCurve block={block} width={width} />;
});

// A read-only sparkline of a block's auto-derived opacity across its duration.
const OpacityAutoCurve = observer(function OpacityAutoCurve({
  block,
  width,
}: {
  block: Block;
  width: number;
}) {
  const samples = sampleBlockOpacity(block);
  const h = OPACITY_CURVE_HEIGHT;
  const pad = 3;
  const points = samples
    .map((s) => `${s.x * width},${pad + (1 - s.y) * (h - 2 * pad)}`)
    .join(" ");
  return (
    <svg width={width} height={h} style={{ flexShrink: 0 }}>
      <polyline points={points} fill="none" stroke="#3182ce" strokeWidth={2} />
    </svg>
  );
});
