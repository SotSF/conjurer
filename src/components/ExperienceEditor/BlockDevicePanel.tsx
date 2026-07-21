import { Block } from "@/src/types/Block";
import { isPalette, Palette } from "@/src/params/palette/Palette";
import { playgroundEffects } from "@/src/effects/effects";
import { useStore } from "@/src/types/StoreContext";
import {
  Box,
  Button,
  Grid,
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
import {
  DragDropContext,
  Draggable,
  Droppable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { MouseEvent as ReactMouseEvent } from "react";

const BASE_EXCLUDED = ["u_time", "u_texture"];
const ARMED_COLOR = "#63b3ed"; // blue.300 — param armed to a timeline lane
const UNARMED_COLOR = "#4a5568"; // gray.600
const PANEL_HEIGHT = 210;

// the top-level pattern block whose device chain the panel shows: the selected
// block, or the parent of a selected effect/variation
const selectedPatternBlock = (store: ReturnType<typeof useStore>): Block | null => {
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
// the selected pattern block's chain: the pattern unit and its effects as
// left-to-right units in signal order. It is the roster + effect-chain home;
// motion is still authored on the timeline lanes. Arming a param (◉) opens its
// lane in the timeline (drives block.lanedParams).
export const BlockDevicePanel = observer(function BlockDevicePanel() {
  const store = useStore();
  const block = selectedPatternBlock(store);
  if (!block) return null;

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
      height={`${PANEL_HEIGHT}px`}
      bg="#12151c"
      borderTopWidth="1px"
      borderColor="#2d3748"
      px={3}
      py={2}
      overflowX="auto"
      overflowY="hidden"
    >
      <HStack justify="space-between" mb={2}>
        <Text fontSize="11px" fontWeight={600} color="gray.400">
          Device chain — {block.pattern.name}{" "}
          <Text as="span" color="gray.500" fontWeight={400}>
            · signal flows left → right
          </Text>
        </Text>
        <Text fontSize="10px" color="gray.500">
          drag units to reorder effects
        </Text>
      </HStack>

      <DragDropContext onDragEnd={onDragEnd}>
        <HStack align="stretch" spacing={0} minW="min-content">
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
                {block.effectBlocks.map((effectBlock, index) => (
                  <Draggable
                    key={effectBlock.id}
                    draggableId={effectBlock.id}
                    index={index}
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
                          index={index}
                          dragHandleProps={prov.dragHandleProps}
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

const ArmToggle = observer(function ArmToggle({
  block,
  uniformName,
}: {
  block: Block;
  uniformName: string;
}) {
  const armed = block.lanedParams.has(uniformName);
  return (
    <Tooltip
      label={armed ? "Remove lane from timeline" : "Arm: show lane in timeline"}
      openDelay={0}
      hasArrow
      fontSize="xs"
    >
      <Text
        as="span"
        fontFamily="mono"
        fontSize="10px"
        cursor="pointer"
        color={armed ? ARMED_COLOR : UNARMED_COLOR}
        onClick={action((e: ReactMouseEvent) => {
          e.stopPropagation();
          block.toggleParamLane(uniformName);
        })}
      >
        {armed ? "◉" : "○"}
      </Text>
    </Tooltip>
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
      justify="space-between"
      bg={isEffect ? "#12161d" : "#141a24"}
      borderRadius="3px"
      px="6px"
      py="3px"
      spacing={2}
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
        <ArmToggle block={block} uniformName={uniformName} />
      )}
    </HStack>
  );
};

const PatternUnit = function PatternUnit({ block }: { block: Block }) {
  const uniformNames = Object.keys(block.pattern.params).filter(
    (name) => !BASE_EXCLUDED.includes(name),
  );
  return (
    <Box
      width="250px"
      flexShrink={0}
      bg="#1e2635"
      border="1px solid #3a4658"
      borderRadius="6px"
      p={2}
    >
      <Text
        fontSize="11px"
        fontWeight={600}
        color="#63b3ed"
        mb="6px"
        noOfLines={1}
      >
        PATTERN · {block.pattern.name}
      </Text>
      <Grid templateColumns="1fr 1fr" gap="4px">
        {uniformNames.map((uniformName) => (
          <ParamCell
            key={uniformName}
            block={block}
            uniformName={uniformName}
            isEffect={false}
          />
        ))}
      </Grid>
    </Box>
  );
};

const EffectUnit = function EffectUnit({
  parentBlock,
  effectBlock,
  index,
  dragHandleProps,
}: {
  parentBlock: Block;
  effectBlock: Block;
  index: number;
  dragHandleProps: any;
}) {
  const uniformNames = Object.keys(effectBlock.pattern.params).filter(
    (name) => !BASE_EXCLUDED.includes(name) && name !== "u_opacity",
  );
  return (
    <Box
      width="190px"
      flexShrink={0}
      bg="#1b212b"
      border="1px solid #2f3a48"
      borderRadius="6px"
      p={2}
    >
      <HStack justify="space-between" mb="6px" spacing={1}>
        <HStack spacing={1} minW={0}>
          <Box {...dragHandleProps} cursor="grab" color="#718096" flexShrink={0}>
            ⠿
          </Box>
          <Text fontSize="10px" fontWeight={600} color="#9fb0c3" noOfLines={1}>
            FX {index + 1} · {effectBlock.pattern.name}
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
      <VStack spacing="4px" align="stretch">
        {uniformNames.map((uniformName) => (
          <ParamCell
            key={uniformName}
            block={effectBlock}
            uniformName={uniformName}
            isEffect
          />
        ))}
      </VStack>
    </Box>
  );
};

const AddEffectUnit = function AddEffectUnit({
  block,
}: {
  block: Block;
}) {
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
        <MenuList rootProps={{ style: { zIndex: 12 } }} maxH="300px" overflowY="auto">
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
