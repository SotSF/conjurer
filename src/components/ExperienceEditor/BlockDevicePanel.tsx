import { Block } from "@/src/types/Block";
import { EffectTrack } from "@/src/types/EffectTrack";
import type { Pattern } from "@/src/types/Pattern";
import { isPalette, Palette } from "@/src/params/palette/Palette";
import { playgroundEffects } from "@/src/effects/effects";
import { paramValueAtTime } from "@/src/utils/paramValueAtTime";
import { vector4ToRgbaString } from "@/src/utils/color";
import { useStore } from "@/src/types/StoreContext";
import { Vector4 } from "three";
import {
  Box,
  Button,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { MdMyLocation, MdViewStream, MdClose } from "react-icons/md";
import { TbTrash } from "react-icons/tb";
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
  ReactElement,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { hoverHelpProps } from "@/src/utils/hoverHelp";

const BASE_EXCLUDED = ["u_time", "u_texture"];
const ARMED_COLOR = "#63b3ed"; // blue.300 — param armed to a timeline lane
const UNARMED_COLOR = "#4a5568"; // gray.600
export const DEVICE_PANEL_HEIGHT = 168;
const CELL_WIDTH = 120;
const CELL_HEIGHT = 22;
const CELL_GAP = 3;

const selectedPatternBlock = (
  store: ReturnType<typeof useStore>,
): Block | null => {
  for (const selection of store.selectedBlocksOrVariations) {
    const block = selection.block;
    return block.parentBlock ?? block;
  }
  return null;
};

// The effect track a block belongs to when it processes composited output
// rather than living on a pattern block; null for ordinary pattern blocks.
const owningEffectTrack = (block: Block): EffectTrack | null =>
  block.layer instanceof EffectTrack ? block.layer : null;

const paletteToGradient = (palette: Palette): string => {
  const stops = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => {
    const c = palette.colorAt(t);
    return `rgb(${Math.round(c.x * 255)},${Math.round(c.y * 255)},${Math.round(
      c.z * 255,
    )})`;
  });
  return `linear-gradient(90deg, ${stops.join(",")})`;
};

// 4a device panel — a fixed-height bottom panel (Ableton Device View) showing
// the selected block's chain: a source and its effects as left-to-right units
// in signal order. For a pattern block the source is the pattern; for a chain
// block it is the composited input the chain is handed. Either way the units
// after it are that block's own effects. It is the roster + effect-chain home;
// motion is still authored on the timeline lanes. Arming a param (◉) opens its
// lane in the timeline (drives block.lanedParams).
export const BlockDevicePanel = observer(function BlockDevicePanel() {
  const store = useStore();
  const block = selectedPatternBlock(store);
  if (!block) return null;

  const track = owningEffectTrack(block);

  // Read the observable array in the component's own (tracked) render so the
  // observer re-renders on add/remove/reorder — reading it only inside the
  // Droppable render-prop below would happen outside this component's tracking.
  const effectBlocks = [...block.effectBlocks];
  const reorderable = effectBlocks.length >= 2;
  const { uiStore } = store;

  const onDragEnd: OnDragEndResponder = action((result) => {
    if (!result.destination) return;
    const effectBlock = effectBlocks[result.source.index];
    if (!effectBlock) return;
    block.reorderEffectBlock(
      effectBlock,
      result.destination.index - result.source.index,
    );
  });

  return (
    <Box
      height={`${DEVICE_PANEL_HEIGHT}px`}
      bg="#12151c"
      borderTopWidth="1px"
      borderColor="#2d3748"
      px={2}
      py={1}
      position="relative"
      display="flex"
      flexDirection="column"
    >
      {/* Overlay so the toolbar doesn't consume a full row of vertical space */}
      <HStack position="absolute" top="2px" right="4px" zIndex={1} spacing={0}>
        <PanelIconButton
          label="Scroll timeline to this block"
          helpDescription="Jump the timeline so this block is visible."
          icon={<MdMyLocation />}
          onClick={action(() => uiStore.scrollToTime(block.startTime))}
        />
        <PanelIconButton
          label="Close device panel"
          helpDescription="Hide the device panel. Selecting a block will reopen it."
          icon={<MdClose />}
          onClick={action(() => {
            uiStore.showDevicePanel = false;
          })}
        />
      </HStack>

      <Box flex="1" minH={0} overflowX="auto" overflowY="hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <HStack align="stretch" spacing={0} minW="min-content" height="100%">
            {track ? (
              <TrackSourceUnit track={track} />
            ) : (
              <PatternUnit block={block} />
            )}
            <Connector />
            <Droppable
              droppableId={`device-${block.id}`}
              direction="horizontal"
            >
              {(provided) => (
                <HStack
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  align="stretch"
                  spacing={0}
                >
                  {effectBlocks.map((effectBlock, index) => (
                    <Draggable
                      key={effectBlock.id}
                      draggableId={effectBlock.id}
                      index={index}
                      isDragDisabled={!reorderable}
                    >
                      {(prov) => (
                        <HStack
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          align="stretch"
                          spacing={0}
                        >
                          {index > 0 && <Connector />}
                          <EffectUnit
                            effectBlock={effectBlock}
                            onRemove={() => block.removeEffectBlock(effectBlock)}
                            dragHandleProps={
                              reorderable ? prov.dragHandleProps : undefined
                            }
                          />
                        </HStack>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </HStack>
              )}
            </Droppable>
            <AddEffectUnit
              onAddEffect={(effect) => block.addCloneOfEffect(effect)}
              helpDescription={
                track
                  ? "Append an effect to this block's chain, applied to its composited input."
                  : "Append an effect to this pattern's processing chain."
              }
            />
          </HStack>
        </DragDropContext>
      </Box>
    </Box>
  );
});

const Connector = () => (
  <Box
    width="20px"
    flexShrink={0}
    display="flex"
    alignItems="center"
    justifyContent="center"
    color="#4a5568"
  >
    ▸
  </Box>
);

// display-only ◉/○ reflecting whether the param's lane is armed; the whole
// ParamCell is the click target
const ArmIndicator = observer(function ArmIndicator({
  block,
  uniformName,
}: {
  block: Block;
  uniformName: string;
}) {
  const armed = block.lanedParams.has(uniformName);
  return (
    <Text
      as="span"
      fontFamily="mono"
      fontSize="10px"
      color={armed ? ARMED_COLOR : UNARMED_COLOR}
    >
      {armed ? "◉" : "○"}
    </Text>
  );
});

const ParamCell = function ParamCell({
  block,
  uniformName,
  isEffect,
}: {
  block: Block;
  uniformName: string;
  isEffect: boolean;
}) {
  const { uiStore } = useStore();
  const param = block.pattern.params[uniformName];
  const armed = block.lanedParams.has(uniformName);
  return (
    <HStack
      height={`${CELL_HEIGHT}px`}
      justify="space-between"
      bg={isEffect ? "#12161d" : "#141a24"}
      borderRadius="3px"
      px="6px"
      spacing={2}
      cursor="pointer"
      _hover={{ bg: isEffect ? "#1a222e" : "#1c2432" }}
      onClick={action((e: ReactMouseEvent) => {
        e.stopPropagation();
        block.toggleParamLane(uniformName);
      })}
      {...hoverHelpProps(
        uiStore,
        param.name,
        armed
          ? "Disarm — hide this parameter's automation lane on the timeline."
          : "Arm — open this parameter's automation lane on the timeline.",
      )}
    >
      <Text
        fontSize="10.5px"
        fontWeight={600}
        color={isEffect ? "#c99a63" : "#ed8936"}
        noOfLines={1}
      >
        {param.name}
      </Text>
      <HStack spacing={1.5} flexShrink={0}>
        <ParamValueReadout block={block} uniformName={uniformName} />
        <ArmIndicator block={block} uniformName={uniformName} />
      </HStack>
    </HStack>
  );
};

const formatNumber = (n: number) =>
  Number.isInteger(n)
    ? String(n)
    : Math.abs(n) < 1000
      ? n.toFixed(2)
      : n.toFixed(0);

// Shows a param's value at the current playhead time (clamped to the block's
// start/end when the playhead is outside the block). Observer so it tracks the
// playhead live as it moves.
const ParamValueReadout = observer(function ParamValueReadout({
  block,
  uniformName,
}: {
  block: Block;
  uniformName: string;
}) {
  const { audioStore } = useStore();
  const value = paramValueAtTime(block, uniformName, audioStore.globalTime);

  if (isPalette(value))
    return (
      <Box
        width="22px"
        height="8px"
        borderRadius="2px"
        flexShrink={0}
        background={paletteToGradient(value)}
      />
    );
  if (value instanceof Vector4)
    return (
      <Box
        width="12px"
        height="12px"
        borderRadius="2px"
        flexShrink={0}
        bg={vector4ToRgbaString(value)}
      />
    );
  if (typeof value === "number")
    return (
      <Text fontFamily="mono" fontSize="9px" color="gray.400">
        {formatNumber(value)}
      </Text>
    );
  return null;
});

// Lays params out top-to-bottom in a single column, spilling into further
// columns only when they exceed the available height. Rows-per-column is
// measured from the container's height (no hardcoded per-pattern count); a CSS
// grid with column auto-flow grows its width to fit the extra columns (unlike
// flex column-wrap, which overflows).
const ParamColumns = function ParamColumns({
  block,
  uniformNames,
  isEffect,
}: {
  block: Block;
  uniformNames: string[];
  isEffect: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState(Math.max(1, uniformNames.length));

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const perColumn = Math.max(
        1,
        Math.floor((el.clientHeight + CELL_GAP) / (CELL_HEIGHT + CELL_GAP)),
      );
      setRows(perColumn);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      flex="1"
      minH={0}
      display="grid"
      gridAutoFlow="column"
      gridTemplateRows={`repeat(${rows}, ${CELL_HEIGHT}px)`}
      gridAutoColumns={`${CELL_WIDTH}px`}
      alignContent="start"
      sx={{ columnGap: `${CELL_GAP}px`, rowGap: `${CELL_GAP}px` }}
    >
      {uniformNames.map((uniformName) => (
        <ParamCell
          key={uniformName}
          block={block}
          uniformName={uniformName}
          isEffect={isEffect}
        />
      ))}
    </Box>
  );
};

const toggleBlockLanes = (block: Block) => {
  const names = block.lanableParamNames;
  const allArmed = names.every((name) => block.lanedParams.has(name));
  block.setParamLanes(names, !allArmed);
};

const PatternUnit = function PatternUnit({ block }: { block: Block }) {
  const uniformNames = Object.keys(block.pattern.params).filter(
    (name) => !BASE_EXCLUDED.includes(name),
  );
  return (
    <Box
      flexShrink={0}
      display="flex"
      flexDirection="column"
      bg="#1e2635"
      border="1px solid #3a4658"
      borderRadius="4px"
      px={1.5}
      py={1}
    >
      <HStack justify="space-between" mb="2px" spacing={1} flexShrink={0}>
        <Text
          fontSize="11px"
          fontWeight={600}
          color="#63b3ed"
          noOfLines={1}
          minW={0}
        >
          {block.pattern.name}
        </Text>
        <PanelIconButton
          label="Toggle all lanes"
          helpDescription="Arm or disarm automation lanes for every parameter in this unit."
          icon={<MdViewStream />}
          onClick={action((e) => {
            e.stopPropagation();
            toggleBlockLanes(block);
          })}
        />
      </HStack>
      <ParamColumns
        block={block}
        uniformNames={uniformNames}
        isEffect={false}
      />
    </Box>
  );
};

const PanelIconButton = function PanelIconButton({
  label,
  helpDescription,
  icon,
  onClick,
}: {
  label: string;
  helpDescription?: string;
  icon: ReactElement;
  onClick: (e: ReactMouseEvent) => void;
}) {
  const { uiStore } = useStore();
  return (
    <Tooltip label={label} openDelay={0} hasArrow fontSize="xs">
      <IconButton
        aria-label={label}
        icon={icon}
        size="xs"
        height="18px"
        minW="18px"
        variant="ghost"
        color="#63b3ed"
        flexShrink={0}
        onClick={onClick}
        {...hoverHelpProps(uiStore, label, helpDescription)}
      />
    </Tooltip>
  );
};

const EffectUnit = function EffectUnit({
  effectBlock,
  onRemove,
  dragHandleProps,
}: {
  effectBlock: Block;
  onRemove: () => void;
  dragHandleProps: any;
}) {
  const { uiStore } = useStore();
  const uniformNames = Object.keys(effectBlock.pattern.params).filter(
    (name) => !BASE_EXCLUDED.includes(name) && name !== "u_opacity",
  );
  return (
    <Box
      flexShrink={0}
      display="flex"
      flexDirection="column"
      bg="#1b212b"
      border="1px solid #2f3a48"
      borderRadius="4px"
      px={1.5}
      py={1}
    >
      <HStack justify="space-between" mb="2px" spacing={1} flexShrink={0}>
        <HStack spacing={1} minW={0}>
          {dragHandleProps && (
            <Box
              {...dragHandleProps}
              cursor="grab"
              color="#718096"
              flexShrink={0}
              {...hoverHelpProps(
                uiStore,
                "Reorder effect",
                "Drag to change this effect's position in the chain.",
              )}
            >
              ⠿
            </Box>
          )}
          <Text fontSize="10px" fontWeight={600} color="#9fb0c3" noOfLines={1}>
            {effectBlock.pattern.name}
          </Text>
        </HStack>
        <HStack spacing={0} flexShrink={0}>
          <PanelIconButton
            label="Toggle all lanes"
            helpDescription="Arm or disarm automation lanes for every parameter on this effect."
            icon={<MdViewStream />}
            onClick={action((e) => {
              e.stopPropagation();
              toggleBlockLanes(effectBlock);
            })}
          />
          <Tooltip label="Remove effect" openDelay={0} hasArrow fontSize="xs">
            <Text
              as="span"
              color="#718096"
              cursor="pointer"
              flexShrink={0}
              _hover={{ color: "#fc8181" }}
              onClick={action(onRemove)}
              {...hoverHelpProps(
                uiStore,
                "Remove effect",
                "Detach this effect from the chain.",
              )}
            >
              <TbTrash size={12} />
            </Text>
          </Tooltip>
        </HStack>
      </HStack>
      <ParamColumns block={effectBlock} uniformNames={uniformNames} isEffect />
    </Box>
  );
};

// Stands in for the pattern at the head of an effect chain block's chain: what
// it processes is the output of a layer or of the whole layer stack.
const TrackSourceUnit = function TrackSourceUnit({
  track,
}: {
  track: EffectTrack;
}) {
  return (
    <Box
      flexShrink={0}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      bg="#1e2635"
      border="1px solid #3a4658"
      borderRadius="4px"
      px={2}
      py={1}
      maxW="140px"
    >
      <Text fontSize="11px" fontWeight={600} color="#63b3ed" noOfLines={1}>
        {track.name}
      </Text>
      <Text fontSize="9.5px" color="#718096" noOfLines={2}>
        composited input
      </Text>
    </Box>
  );
};

const AddEffectUnit = function AddEffectUnit({
  onAddEffect,
  helpDescription,
}: {
  onAddEffect: (effect: Pattern) => void;
  helpDescription: string;
}) {
  const { uiStore } = useStore();
  return (
    <Menu placement="top">
      <MenuButton
        as={Button}
        variant="unstyled"
        ml={2}
        width="48px"
        height="auto"
        flexShrink={0}
        border="1px dashed #3a4658"
        borderRadius="4px"
        color="#718096"
        fontSize="20px"
        fontWeight={400}
        {...hoverHelpProps(uiStore, "Add effect", helpDescription)}
      >
        ＋
      </MenuButton>
      <Portal>
        <MenuList
          rootProps={{ style: { zIndex: 12 } }}
          maxH="300px"
          overflowY="auto"
        >
          {playgroundEffects.map((effect) => (
            <MenuItem
              key={effect.name}
              onClick={action(() => onAddEffect(effect))}
            >
              {effect.name}
            </MenuItem>
          ))}
        </MenuList>
      </Portal>
    </Menu>
  );
};
