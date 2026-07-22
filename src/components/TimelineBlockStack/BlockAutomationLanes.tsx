import { Block } from "@/src/types/Block";
import { ParameterVariations } from "@/src/components/ParameterVariations/ParameterVariations";
import { sampleBlockOpacity } from "@/src/utils/blockOpacity";
import { paramValueAtTime } from "@/src/utils/paramValueAtTime";
import { useStore } from "@/src/types/StoreContext";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { TIMELINE_HEADER_WIDTH } from "@/src/types/UIStore";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { MouseEvent as ReactMouseEvent } from "react";

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
      spacing={0.5}
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
      {isOpacity ? (
        <OpacityLaneBody block={ownerBlock} />
      ) : (
        <ParameterVariations uniformName={uniformName} block={ownerBlock} />
      )}
      {/* param label: lives inside the lane, pinned to the left of the view
          (like the block name), click-through, and faint on hover so it never
          obstructs editing the curve underneath */}
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

  // controls float top-right and reveal on lane hover (quiet by default)
  const hoverControls = {
    position: "absolute" as const,
    top: "1px",
    right: "2px",
    zIndex: 3,
    bg: "rgba(15,17,21,.85)",
    borderRadius: "3px",
    px: "4px",
    opacity: 0,
    pointerEvents: "none" as const,
    transition: "opacity 0.12s",
    _groupHover: { opacity: 1, pointerEvents: "auto" as const },
  };

  if (block.hasManualOpacity) {
    return (
      <Box position="relative" width="100%">
        <ParameterVariations uniformName="u_opacity" block={block} />
        <HStack spacing={1} align="center" {...hoverControls}>
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
      </Box>
    );
  }

  const hasAutoFade = !!block.layer?.autoOpacityVariations(block);
  const width = uiStore.timeToX(block.duration);

  return (
    <Box position="relative" width="100%">
      <OpacityAutoCurve block={block} width={width} />
      <HStack spacing={1} align="center" {...hoverControls}>
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
      </HStack>
    </Box>
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
