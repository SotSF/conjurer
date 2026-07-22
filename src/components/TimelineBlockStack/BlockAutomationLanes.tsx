import { Block } from "@/src/types/Block";
import { Variation } from "@/src/types/Variations/Variation";
import { ParameterVariations } from "@/src/components/ParameterVariations/ParameterVariations";
import { sampleBlockOpacity } from "@/src/utils/blockOpacity";
import { paramValueAtTime } from "@/src/utils/paramValueAtTime";
import { reorder } from "@/src/utils/array";
import { useStore } from "@/src/types/StoreContext";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { TIMELINE_HEADER_WIDTH } from "@/src/types/UIStore";
import {
  DragDropContext,
  Draggable,
  Droppable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { MouseEvent as ReactMouseEvent } from "react";

const OPACITY_CURVE_HEIGHT = 26;
const REGION_BAR_HEIGHT = 18;

// A region's modulation type → its label + accent color (the type is conveyed
// by the tab's accent color even at rest; the label appears on hover).
const regionTypeStyle = (variation: Variation): { label: string; color: string } => {
  switch (variation.type) {
    case "periodic":
      return { label: "LFO", color: "#66bb94" };
    case "audio":
      return { label: "AUDIO", color: "#63b3ed" };
    case "palette":
      return { label: "PALETTE", color: "#b794f4" };
    case "linear4":
      return { label: "COLOR", color: "#f6ad55" };
    default:
      // flat / linear / easing / spline all read as a drawn curve
      return { label: "CURVE", color: "#ed8936" };
  }
};

type Lane = {
  // the block the param lives on (the pattern block, or one of its effects)
  ownerBlock: Block;
  uniformName: string;
  label: string;
  isOpacity: boolean;
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

  return (
    <Box position="relative" width="100%" role="group">
      {/* the curve, with the pinned param name overlaid top-left */}
      <Box position="relative" width="100%">
        {isOpacity ? (
          <OpacityLaneBody block={ownerBlock} />
        ) : (
          <ParameterVariations uniformName={uniformName} block={ownerBlock} />
        )}

        {/* region control bar — nothing at rest (lanes stay flush); on hover it
            appears as an overlay floating just above the curve, so it never
            covers a node and costs no vertical space */}
        <Box
          position="absolute"
          bottom="100%"
          left={0}
          width="100%"
          zIndex={5}
          opacity={0}
          pointerEvents="none"
          transition="opacity 0.12s"
          _groupHover={{ opacity: 1, pointerEvents: "auto" }}
        >
          <RegionBar
            block={ownerBlock}
            uniformName={uniformName}
            isOpacity={isOpacity}
          />
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
}: {
  block: Block;
  uniformName: string;
  isOpacity: boolean;
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
                  >
                    <RegionTab
                      block={block}
                      uniformName={uniformName}
                      variation={variation}
                      multiple={multiple}
                      dragHandleProps={prov.dragHandleProps}
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
}: {
  block: Block;
  uniformName: string;
  variation: Variation;
  multiple: boolean;
  dragHandleProps: any;
}) {
  const store = useStore();
  const { label, color } = regionTypeStyle(variation);
  return (
    <HStack
      position="relative"
      height="100%"
      spacing={0}
      px="6px"
      borderTopWidth="2px"
      borderColor={color}
      bg={`${color}22`}
      align="center"
    >
      {/* type label (+ drag handle) pinned to the left of the view so it stays
          visible when the region's left edge scrolls off */}
      <HStack
        position="sticky"
        left={`${TIMELINE_HEADER_WIDTH}px`}
        spacing="5px"
        flexShrink={0}
        zIndex={1}
      >
        {multiple && (
          <Box {...dragHandleProps} cursor="grab" color="#8a97a8" fontSize="10px">
            ⠿
          </Box>
        )}
        <Text
          fontSize="9px"
          fontWeight={700}
          letterSpacing="0.02em"
          color={color}
          noOfLines={1}
        >
          {label}
        </Text>
      </HStack>
      <Box flex="1" minW={0} />
      {/* controls pinned to the right of the view so they stay reachable when
          the region's right edge scrolls off */}
      <HStack
        position="sticky"
        right="0"
        spacing="8px"
        flexShrink={0}
        zIndex={1}
        color="#c3cdda"
        fontSize="11px"
      >
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
