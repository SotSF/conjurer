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
  Portal,
  Text,
  Tooltip,
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
import {
  MouseEvent as ReactMouseEvent,
  useEffect,
  useState,
} from "react";
import { TbChevronUp } from "react-icons/tb";
import { AddRegionMenu } from "@/src/components/ParameterVariations/AddRegionMenu";
import { CurveRangeControl } from "@/src/components/ParameterVariations/CurveRangeControl";
import { RegionSettingsPopover } from "@/src/components/ParameterVariations/RegionSettingsPopover";
import { CurveVariation } from "@/src/types/Variations/CurveVariation";
import { PeriodicVariation } from "@/src/types/Variations/PeriodicVariation";
import { hoverHelpProps } from "@/src/utils/hoverHelp";
import { AudioVariation } from "@/src/types/Variations/AudioVariation";
import {
  allowedInsertTypes,
  convertRegion,
  InsertType,
  regionTypeOf,
  RegionType,
} from "@/src/utils/regionConvert";

const OPACITY_CURVE_HEIGHT = 26;
const LANE_NAME_HEIGHT = 20;
const REGION_BAR_HEIGHT = 16;
// below this rendered width a region tab collapses to just its colored segment,
// revealing its full header (over neighbors) only when that region is hovered
const NARROW_TAB_PX = 84;

// A region's modulation type → its label + a quiet accent. Accents stay muted so
// the param name above remains the visual parent; the type is readable but not
// competing with it.
const regionTypeStyle = (
  variation: Variation,
): { label: string; color: string; bg: string } => {
  switch (variation.type) {
    case "periodic":
      return { label: "LFO", color: "#5a8f74", bg: "#151c22" };
    case "audio":
      return { label: "AUDIO", color: "#5a8fb0", bg: "#151a22" };
    case "palette":
      return { label: "PALETTE", color: "#7a6a9e", bg: "#18161f" };
    case "linear4":
      return { label: "COLOR", color: "#a07a4a", bg: "#1a1714" };
    default:
      // flat / linear / easing / spline all read as a drawn curve
      return { label: "CURVE", color: "#a07850", bg: "#1a1714" };
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
// width. Each lane has permanent chrome above the curve (repeating param name +
// region bar) that separates lanes visually and keeps controls out of the
// editable curve area.
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
  const store = useStore();
  const { uiStore } = store;
  // the region under the cursor, mapped from mouse X, so hovering anywhere in
  // the lane lifts that region's header to front
  const [curveRegionId, setCurveRegionId] = useState<string | null>(null);
  // the region whose header the cursor is directly over; takes precedence so a
  // header that overflows onto a neighbor stays reachable (its buttons don't
  // get covered when the cursor crosses into the neighbor's X)
  const [headerRegionId, setHeaderRegionId] = useState<string | null>(null);
  const hoveredRegionId = headerRegionId ?? curveRegionId;

  const selected =
    store.selectedParameter?.block === ownerBlock &&
    store.selectedParameter?.uniformName === uniformName;
  const selectThisParameter = action(() => {
    store.selectParameter(ownerBlock, uniformName);
  });

  // Region insert: the name-row ＋ arms a one-shot insert of a chosen type
  // (gated to the param's sensible types); the insert overlay in the lane body
  // then captures paint/click. Esc cancels. Available on a MANUAL opacity lane
  // (numeric → curve/lfo/audio), but not on an auto-opacity lane (no regions
  // yet — Customize materializes them first).
  const insertTypes =
    isOpacity && !ownerBlock.hasManualOpacity
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
    <Box
      position="relative"
      width="100%"
      role="group"
      borderTopWidth="1px"
      borderColor="#2a3444"
      onMouseMove={onMouseMove}
      onMouseLeave={() => setCurveRegionId(null)}
    >
      {/* permanent chrome between params: repeating name + region map/controls.
          Lives in layout (not over the curve) so nodes stay clickable and each
          lane has a clear top edge for reading max/min proximity. */}
      <LaneNameHeader
        block={ownerBlock}
        uniformName={uniformName}
        label={label}
        selected={selected}
        onSelect={selectThisParameter}
        insertTypes={insertTypes}
        armedType={armedType}
        setArmedType={setArmedType}
      />
      <RegionBar
        block={ownerBlock}
        uniformName={uniformName}
        isOpacity={isOpacity}
        hoveredRegionId={hoveredRegionId}
        setHeaderRegionId={setHeaderRegionId}
        onSelect={selectThisParameter}
      />

      {isOpacity ? (
        <OpacityLaneBody
          block={ownerBlock}
          armedType={armedType}
          onInserted={() => setArmedType(null)}
        />
      ) : (
        <ParameterVariations
          uniformName={uniformName}
          block={ownerBlock}
          laneDuration={lane.laneDuration}
          armedType={armedType}
          onInserted={() => setArmedType(null)}
        />
      )}
    </Box>
  );
});

// Param name row above the region bar. The visual parent of the lane — stronger
// than the region tabs below. Repeats across wide blocks and hosts the
// lane-level ＋ so it never overlays editable curve points. Click selects this
// parameter (and its block); the live value readout only mounts when selected
// so playhead updates don't thrash every lane.
const LaneNameHeader = observer(function LaneNameHeader({
  block,
  uniformName,
  label,
  selected,
  onSelect,
  insertTypes,
  armedType,
  setArmedType,
}: {
  block: Block;
  uniformName: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
  insertTypes: InsertType[];
  armedType: InsertType | null;
  setArmedType: (t: InsertType | null) => void;
}) {
  const { uiStore } = useStore();
  const headerBg = selected ? "#2a3a52" : "#1c2533";
  const nameColor = selected ? "#ffd89a" : "#f6ad55";

  return (
    <HStack
      height={`${LANE_NAME_HEIGHT}px`}
      width="100%"
      spacing={0}
      px="6px"
      bg={headerBg}
      borderBottomWidth="1px"
      borderColor="#3a4658"
      align="center"
      cursor="pointer"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      {...hoverHelpProps(
        uiStore,
        `${label} lane`,
        "Automation lane — click regions to edit curves. Drag across the lane to select a time span.",
      )}
    >
      <HStack flex="1" minW={0} spacing={0} align="center">
        {/* equal-width segments so repeats are spaced across the block; the
            first stays sticky (+ value when selected) while scrolling */}
        {Array.from({ length: block.headerRepetitions }).map((_, i) => (
          <HStack
            key={i}
            flexGrow={1}
            minW={0}
            spacing={1.5}
            align="baseline"
            justify="flex-start"
            {...(i === 0
              ? {
                  position: "sticky" as const,
                  left: `${TIMELINE_HEADER_WIDTH}px`,
                  zIndex: 1,
                  bg: headerBg,
                }
              : {})}
          >
            <Text
              fontSize="12px"
              fontWeight={700}
              color={nameColor}
              whiteSpace="nowrap"
              letterSpacing="0.01em"
            >
              {label}
            </Text>
            {selected && i === 0 && (
              <LaneValueReadout block={block} uniformName={uniformName} />
            )}
          </HStack>
        ))}
      </HStack>
      <HStack
        position="sticky"
        right={0}
        flexShrink={0}
        spacing={1.5}
        align="center"
        color="#a0aec0"
        pl={1}
        bg={headerBg}
        onClick={(e) => e.stopPropagation()}
      >
        {insertTypes.length > 0 && (
          <AddRegionMenu
            types={insertTypes}
            armedType={armedType}
            setArmedType={setArmedType}
          />
        )}
        <Tooltip
          label="Collapse lane"
          openDelay={0}
          hasArrow
          placement="top"
          fontSize="xs"
        >
          <Box
            as="span"
            display="inline-flex"
            cursor="pointer"
            color="#a0aec0"
            _hover={{ color: "#63b3ed" }}
            onClick={action(() => {
              block.toggleParamLane(uniformName);
            })}
            {...hoverHelpProps(
              uiStore,
              "Collapse lane",
              "Hide this automation lane. Re-arm the parameter to show it again.",
            )}
          >
            <TbChevronUp size={13} />
          </Box>
        </Tooltip>
      </HStack>
    </HStack>
  );
});

// The control bar above a lane: one tab per region, sized to the region's
// width (so the bar doubles as a region map). Always in layout so it separates
// lanes and never covers curve nodes.
const RegionBar = observer(function RegionBar({
  block,
  uniformName,
  isOpacity,
  hoveredRegionId,
  setHeaderRegionId,
  onSelect,
}: {
  block: Block;
  uniformName: string;
  isOpacity: boolean;
  hoveredRegionId: string | null;
  setHeaderRegionId: (id: string | null) => void;
  onSelect: () => void;
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
        borderTopWidth="1px"
        borderColor="#3a5a78"
        bg="#141820"
        align="center"
        cursor="pointer"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <Text
          position="sticky"
          left={`${TIMELINE_HEADER_WIDTH}px`}
          fontSize="8px"
          fontWeight={600}
          letterSpacing="0.04em"
          color="#6a8fa8"
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
            bg="#141820"
            cursor="pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
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
  // suppress the convert tooltip while its menu is open (trigger keeps focus)
  const [convertOpen, setConvertOpen] = useState(false);

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
      fontSize="8px"
      fontWeight={600}
      letterSpacing="0.06em"
      color={color}
      noOfLines={1}
      textTransform="uppercase"
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
      <Tooltip
        label="Convert region type"
        openDelay={0}
        hasArrow
        placement="top"
        fontSize="xs"
        isDisabled={convertOpen}
      >
        <Box as="span" display="inline-flex">
          <Menu
            isLazy
            placement="bottom-start"
            onOpen={() => setConvertOpen(true)}
            onClose={() => setConvertOpen(false)}
          >
            <MenuButton
              onClick={(e) => e.stopPropagation()}
              style={{ cursor: "pointer" }}
            >
              {typeLabelText}
            </MenuButton>
            <Portal>
              <MenuList minW="140px" bg="gray.700" py={1} zIndex={1600}>
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
                      block.replaceRegionInPlace(
                        uniformName,
                        variation,
                        replacement,
                      );
                    })}
                  >
                    Convert to{" "}
                    {t === "lfo" ? "LFO" : t[0].toUpperCase() + t.slice(1)}
                  </MenuItem>
                ))}
              </MenuList>
            </Portal>
          </Menu>
        </Box>
      </Tooltip>
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
      <Tooltip
        label="Reset region to default"
        openDelay={0}
        hasArrow
        placement="top"
        fontSize="xs"
      >
        <Box
          as="span"
          cursor="pointer"
          _hover={{ color: "#63b3ed" }}
          onClick={action((e: ReactMouseEvent) => {
            e.stopPropagation();
            block.resetVariationToDefault(uniformName, variation);
          })}
        >
          ↺
        </Box>
      </Tooltip>
      {multiple && (
        <Tooltip
          label="Delete region"
          openDelay={0}
          hasArrow
          placement="top"
          fontSize="xs"
        >
          <Box
            as="span"
            cursor="pointer"
            _hover={{ color: "#fc8181" }}
            onClick={action((e: ReactMouseEvent) => {
              e.stopPropagation();
              store.deleteVariation(block, uniformName, variation);
            })}
          >
            ✕
          </Box>
        </Tooltip>
      )}
    </HStack>
  );

  // narrow: the tab is just a colored segment, but its full header renders as an
  // overflow to the right (opaque, so the next tab covers it unless this one is
  // hovered, which lifts it via the wrapper's z-index). top:-1px so the header's
  // top border lines up with the bar's, not 1px below the tab's own border.
  if (narrow)
    return (
      <Box
        position="relative"
        height="100%"
        borderTopWidth="1px"
        borderColor={color}
        bg={bg}
      >
        <HStack
          position="absolute"
          top="-1px"
          left={0}
          height={`${REGION_BAR_HEIGHT}px`}
          width="max-content"
          spacing="5px"
          px="6px"
          bg={bg}
          borderTopWidth="1px"
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
      borderTopWidth="1px"
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
  armedType,
  onInserted,
}: {
  block: Block;
  armedType: InsertType | null;
  onInserted: () => void;
}) {
  const { uiStore } = useStore();

  if (block.hasManualOpacity)
    return (
      <ParameterVariations
        uniformName="u_opacity"
        block={block}
        armedType={armedType}
        onInserted={onInserted}
      />
    );

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
