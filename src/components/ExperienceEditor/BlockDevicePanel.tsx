import { Block } from "@/src/types/Block";
import { isPalette, Palette } from "@/src/params/palette/Palette";
import { playgroundEffects } from "@/src/effects/effects";
import { useStore } from "@/src/types/StoreContext";
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

const BASE_EXCLUDED = ["u_time", "u_texture"];
const ARMED_COLOR = "#63b3ed"; // blue.300 — param armed to a timeline lane
const UNARMED_COLOR = "#4a5568"; // gray.600
export const DEVICE_PANEL_HEIGHT = 210;
const CELL_WIDTH = 120;
const CELL_HEIGHT = 22;
const CELL_GAP = 4;

const selectedPatternBlock = (
  store: ReturnType<typeof useStore>,
): Block | null => {
  for (const selection of store.selectedBlocksOrVariations) {
    const block = selection.block;
    return block.parentBlock ?? block;
  }
  return null;
};

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
// the selected pattern block's chain: the pattern and its effects as
// left-to-right units in signal order. It is the roster + effect-chain home;
// motion is still authored on the timeline lanes. Arming a param (◉) opens its
// lane in the timeline (drives block.lanedParams).
export const BlockDevicePanel = observer(function BlockDevicePanel() {
  const store = useStore();
  const block = selectedPatternBlock(store);
  if (!block) return null;

  // Read the observable array in the component's own (tracked) render so the
  // observer re-renders on add/remove/reorder — reading it only inside the
  // Droppable render-prop below would happen outside this component's tracking.
  const effectBlocks = [...block.effectBlocks];
  const reorderable = effectBlocks.length >= 2;

  const onDragEnd: OnDragEndResponder = action((result) => {
    if (!result.destination) return;
    const effectBlock = block.effectBlocks[result.source.index];
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
      px={3}
      py={2}
      display="flex"
      flexDirection="column"
    >
      <Box flex="1" minH={0} overflowX="auto" overflowY="hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <HStack align="stretch" spacing={0} minW="min-content" height="100%">
            <PatternUnit block={block} />
            <Connector />
            <Droppable droppableId={`device-${block.id}`} direction="horizontal">
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
                            parentBlock={block}
                            effectBlock={effectBlock}
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
            <AddEffectUnit block={block} />
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
  const param = block.pattern.params[uniformName];
  const palette = isPalette(param.value);
  return (
    <HStack
      height={`${CELL_HEIGHT}px`}
      justify="space-between"
      bg={isEffect ? "#12161d" : "#141a24"}
      borderRadius="3px"
      px="6px"
      spacing={2}
      cursor={palette ? "default" : "pointer"}
      _hover={palette ? undefined : { bg: isEffect ? "#1a222e" : "#1c2432" }}
      onClick={
        palette
          ? undefined
          : action((e: ReactMouseEvent) => {
              e.stopPropagation();
              block.toggleParamLane(uniformName);
            })
      }
    >
      <Text
        fontSize="10.5px"
        fontWeight={600}
        color={isEffect ? "#c99a63" : "#ed8936"}
        noOfLines={1}
      >
        {param.name}
      </Text>
      {palette ? (
        <Box
          flexShrink={0}
          width="22px"
          height="8px"
          borderRadius="2px"
          background={paletteToGradient(param.value as Palette)}
        />
      ) : (
        <ArmIndicator block={block} uniformName={uniformName} />
      )}
    </HStack>
  );
};

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

const PatternUnit = function PatternUnit({ block }: { block: Block }) {
  const { uiStore } = useStore();
  const uniformNames = Object.keys(block.pattern.params).filter(
    (name) => !BASE_EXCLUDED.includes(name),
  );

  const toggleAllLanes = action(() => {
    const blocks = [block, ...block.effectBlocks];
    const allArmed = blocks.every((b) =>
      b.lanableParamNames.every((name) => b.lanedParams.has(name)),
    );
    blocks.forEach((b) => b.setParamLanes(b.lanableParamNames, !allArmed));
  });

  return (
    <Box
      flexShrink={0}
      display="flex"
      flexDirection="column"
      bg="#1e2635"
      border="1px solid #3a4658"
      borderRadius="6px"
      p={2}
    >
      <HStack justify="space-between" mb="6px" spacing={1} flexShrink={0}>
        <Text fontSize="11px" fontWeight={600} color="#63b3ed" noOfLines={1}>
          {block.pattern.name}
        </Text>
        <HStack spacing={0} flexShrink={0}>
          <PanelIconButton
            label="Toggle all lanes"
            icon={<MdViewStream />}
            onClick={toggleAllLanes}
          />
          <PanelIconButton
            label="Scroll timeline to this block"
            icon={<MdMyLocation />}
            onClick={action(() => uiStore.scrollToTime(block.startTime))}
          />
          <PanelIconButton
            label="Close device panel"
            icon={<MdClose />}
            onClick={action(() => {
              uiStore.showDevicePanel = false;
            })}
          />
        </HStack>
      </HStack>
      <ParamColumns block={block} uniformNames={uniformNames} isEffect={false} />
    </Box>
  );
};

const PanelIconButton = function PanelIconButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactElement;
  onClick: (e: ReactMouseEvent) => void;
}) {
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
      />
    </Tooltip>
  );
};

const EffectUnit = function EffectUnit({
  parentBlock,
  effectBlock,
  dragHandleProps,
}: {
  parentBlock: Block;
  effectBlock: Block;
  dragHandleProps: any;
}) {
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
      borderRadius="6px"
      p={2}
    >
      <HStack justify="space-between" mb="6px" spacing={1} flexShrink={0}>
        <HStack spacing={1} minW={0}>
          {dragHandleProps && (
            <Box {...dragHandleProps} cursor="grab" color="#718096" flexShrink={0}>
              ⠿
            </Box>
          )}
          <Text fontSize="10px" fontWeight={600} color="#9fb0c3" noOfLines={1}>
            {effectBlock.pattern.name}
          </Text>
        </HStack>
        <Tooltip label="Remove effect" openDelay={0} hasArrow fontSize="xs">
          <Text
            as="span"
            color="#718096"
            cursor="pointer"
            flexShrink={0}
            _hover={{ color: "#fc8181" }}
            onClick={action(() => parentBlock.removeEffectBlock(effectBlock))}
          >
            ✕
          </Text>
        </Tooltip>
      </HStack>
      <ParamColumns block={effectBlock} uniformNames={uniformNames} isEffect />
    </Box>
  );
};

const AddEffectUnit = function AddEffectUnit({ block }: { block: Block }) {
  return (
    <Menu placement="top">
      <MenuButton
        as={Button}
        variant="unstyled"
        ml={3}
        width="60px"
        height="auto"
        flexShrink={0}
        border="1px dashed #3a4658"
        borderRadius="6px"
        color="#718096"
        fontSize="22px"
        fontWeight={400}
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
              onClick={action(() => block.addCloneOfEffect(effect))}
            >
              {effect.name}
            </MenuItem>
          ))}
        </MenuList>
      </Portal>
    </Menu>
  );
};
