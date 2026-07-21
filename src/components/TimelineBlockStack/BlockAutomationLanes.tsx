import { Block } from "@/src/types/Block";
import { ParameterVariations } from "@/src/components/ParameterVariations/ParameterVariations";
import { sampleBlockOpacity } from "@/src/utils/blockOpacity";
import { useStore } from "@/src/types/StoreContext";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { MouseEvent as ReactMouseEvent } from "react";

const LABEL_WIDTH = 72;
const LABEL_GAP = 6;
const OPACITY_CURVE_HEIGHT = 26;

type Lane = {
  // the block the param lives on (the pattern block, or one of its effects)
  ownerBlock: Block;
  uniformName: string;
  label: string;
  isOpacity: boolean;
};

// The set of parameters whose automation lanes are toggled open beneath a
// block, gathered from the pattern block and each of its effect blocks.
const gatherLanes = (block: Block): Lane[] => {
  const lanes: Lane[] = [];
  for (const uniformName of block.lanedParams) {
    const param = block.pattern.params[uniformName];
    if (!param) continue;
    lanes.push({
      ownerBlock: block,
      uniformName,
      label: param.name,
      isOpacity: uniformName === "u_opacity",
    });
  }
  for (const effectBlock of block.effectBlocks) {
    for (const uniformName of effectBlock.lanedParams) {
      const param = effectBlock.pattern.params[uniformName];
      if (!param) continue;
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

// Automation lanes rendered directly beneath a block, spanning only the
// block's width. Each lane shows the parameter's value-over-time curve (or, for
// opacity, its auto crossfade) with the param name in the gutter to its left.
export const BlockAutomationLanes = observer(function BlockAutomationLanes({
  block,
}: {
  block: Block;
}) {
  const lanes = gatherLanes(block);
  if (lanes.length === 0) return null;

  return (
    <VStack
      spacing={1}
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
          patternBlock={block}
          lane={lane}
        />
      ))}
    </VStack>
  );
});

const AutomationLane = observer(function AutomationLane({
  patternBlock,
  lane,
}: {
  patternBlock: Block;
  lane: Lane;
}) {
  const { uiStore } = useStore();
  const { ownerBlock, uniformName, label, isOpacity } = lane;

  // The label normally sits in the gutter just left of the block, right-aligned
  // so it ends at the block's left edge. Near t=0 there is no gutter, so we
  // clamp its left edge to the timeline start (t=0) and render it over a scrim
  // so the name never falls off the timeline view.
  const blockLeftX = uiStore.timeToX(patternBlock.startTime);
  const desiredLeft = -(LABEL_WIDTH + LABEL_GAP);
  const clamped = blockLeftX < LABEL_WIDTH + LABEL_GAP;
  const labelLeft = clamped ? -blockLeftX : desiredLeft;

  return (
    <Box position="relative" width="100%">
      <Text
        position="absolute"
        top="2px"
        left={`${labelLeft}px`}
        width={`${LABEL_WIDTH}px`}
        textAlign={clamped ? "left" : "right"}
        fontSize="10px"
        fontWeight={600}
        color="#ed8936"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        pointerEvents="none"
        zIndex={2}
        bg={clamped ? "rgba(15,17,21,.82)" : undefined}
        borderRadius={clamped ? "0 3px 3px 0" : undefined}
        px={clamped ? "4px" : undefined}
      >
        {label}
      </Text>
      {isOpacity ? (
        <OpacityLaneBody block={ownerBlock} />
      ) : (
        <ParameterVariations uniformName={uniformName} block={ownerBlock} />
      )}
    </Box>
  );
});

const OpacityLaneBody = observer(function OpacityLaneBody({
  block,
}: {
  block: Block;
}) {
  const { uiStore } = useStore();

  if (block.hasManualOpacity) {
    return (
      <VStack spacing={0} align="stretch" width="100%">
        <HStack spacing={1} justify="flex-end" width="100%">
          <Text fontSize="9px" color="#a0aec0">
            manual
          </Text>
          <Button
            size="xs"
            height="16px"
            fontSize="9px"
            variant="ghost"
            onClick={action((e: ReactMouseEvent) => {
              e.stopPropagation();
              block.resetOpacityToAuto();
            })}
          >
            Reset to auto
          </Button>
        </HStack>
        <ParameterVariations uniformName="u_opacity" block={block} />
      </VStack>
    );
  }

  const hasAutoFade = !!block.layer?.autoOpacityVariations(block);
  const width = uiStore.timeToX(block.duration);

  return (
    <HStack spacing={2} align="center" width="100%">
      <OpacityAutoCurve block={block} width={width} />
      <VStack spacing={0} align="flex-start" flexShrink={0}>
        <Text fontSize="9px" color="#68d391">
          {hasAutoFade ? "auto crossfade" : "fully opaque"}
        </Text>
        <Button
          size="xs"
          height="16px"
          fontSize="9px"
          variant="ghost"
          onClick={action((e: ReactMouseEvent) => {
            e.stopPropagation();
            block.materializeAutoOpacity();
          })}
        >
          Customize
        </Button>
      </VStack>
    </HStack>
  );
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
