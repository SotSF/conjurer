import { Block } from "@/src/types/Block";
import { isPalette } from "@/src/params/palette/Palette";
import { isParamAuthored } from "@/src/utils/isParamAuthored";
import { TIMELINE_HEADER_WIDTH } from "@/src/types/UIStore";
import { useStore } from "@/src/types/StoreContext";
import { Box, HStack, Text, Tooltip } from "@chakra-ui/react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { MouseEvent as ReactMouseEvent, useState } from "react";

// params that are machinery rather than user-facing controls
const BASE_EXCLUDED = ["u_time", "u_texture"];

const AUTHORED_COLOR = "#ed8936"; // orange.400
const EFFECT_COLOR = "#c99a63"; // muted amber for effect params
const OPACITY_COLOR = "#3182ce"; // blue.500 — authored/manual opacity
const FADING_COLOR = "#63b3ed"; // blue.300 — auto crossfade
const DEFAULT_BORDER = "#4a5568"; // gray.600

// approximate horizontal footprint of one dot (dot + gap), for deciding when
// the row is too wide for the block and must collapse to a badge
const DOT_FOOTPRINT = 13;
const ROW_PADDING = 20;

type Signal = {
  // the block the param lives on (the pattern block, or one of its effects)
  block: Block;
  uniformName: string;
  label: string;
  authored: boolean;
  laneOn: boolean;
  // opacity is special: it can be auto-crossfading without being authored
  isOpacity: boolean;
  fading: boolean;
  // palettes are a fixed gradient, not a time curve, so they get no lane
  isPalette: boolean;
  isEffect: boolean;
};

const gatherSignals = (block: Block) => {
  const autoFading = !!block.layer?.autoOpacityVariations(block);

  const patternSignals: Signal[] = Object.entries(block.pattern.params)
    .filter(([uniformName]) => !BASE_EXCLUDED.includes(uniformName))
    .map(([uniformName, patternParam]) => {
      const isOpacity = uniformName === "u_opacity";
      // opacity is special: the pipeline writes the live crossfade value back
      // onto the param, so authored-ness is whether a manual variation exists
      const authored = isOpacity
        ? block.hasManualOpacity
        : isParamAuthored(block, uniformName);
      return {
        block,
        uniformName,
        label: patternParam.name,
        authored,
        laneOn: block.lanedParams.has(uniformName),
        isOpacity,
        fading: isOpacity && !authored && autoFading,
        isPalette: isPalette(patternParam.value),
        isEffect: false,
      };
    });

  const effectSignals: Signal[] = block.effectBlocks.flatMap((effectBlock) =>
    Object.entries(effectBlock.pattern.params)
      .filter(
        ([uniformName]) =>
          !BASE_EXCLUDED.includes(uniformName) && uniformName !== "u_opacity",
      )
      .map(([uniformName, patternParam]) => ({
        block: effectBlock,
        uniformName,
        label: `${effectBlock.pattern.name} · ${patternParam.name}`,
        authored: isParamAuthored(effectBlock, uniformName),
        laneOn: effectBlock.lanedParams.has(uniformName),
        isOpacity: false,
        fading: false,
        isPalette: isPalette(patternParam.value),
        isEffect: true,
      })),
  );

  return { patternSignals, effectSignals };
};

// A glanceable row of per-parameter signals shown beneath a collapsed block's
// header. Each dot reflects whether its param is authored / at default /
// crossfading and whether its automation lane is open; clicking a dot toggles
// that lane. Effect params appear after a divider as diamonds so they never
// blur into the pattern's own dots. When the block is too narrow to fit the
// row, it collapses to a summary badge that pops the full row on hover/select.
export const BlockDotRow = observer(function BlockDotRow({
  block,
  isSelected,
}: {
  block: Block;
  isSelected: boolean;
}) {
  const { uiStore } = useStore();
  const [hovered, setHovered] = useState(false);

  const { patternSignals, effectSignals } = gatherSignals(block);
  const signalCount = patternSignals.length + effectSignals.length;
  if (signalCount === 0) return null;

  const blockWidth = uiStore.timeToX(block.duration);
  const neededWidth =
    signalCount * DOT_FOOTPRINT +
    (effectSignals.length > 0 ? DOT_FOOTPRINT : 0) +
    ROW_PADDING;
  const narrow = blockWidth < neededWidth;

  if (!narrow) {
    return (
      // pin the dots to the left of the visible timeline, like the block name,
      // so they stay in view when the block is scrolled wider than the viewport
      <Box
        position="sticky"
        left={`${TIMELINE_HEADER_WIDTH}px`}
        width="fit-content"
        maxWidth="100%"
        zIndex={1}
      >
        <DotList patternSignals={patternSignals} effectSignals={effectSignals} />
      </Box>
    );
  }

  const authoredCount = [...patternSignals, ...effectSignals].filter(
    (s) => s.authored,
  ).length;
  const opacitySignal = patternSignals.find((s) => s.isOpacity);
  const opacityFill = opacitySignal?.authored
    ? OPACITY_COLOR
    : opacitySignal?.fading
      ? FADING_COLOR
      : "transparent";

  const expanded = hovered || isSelected;

  return (
    <Box
      position="relative"
      width="100%"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <HStack spacing="3px" px={2} pb={1} justify="center">
        <Box
          as="span"
          width="7px"
          height="7px"
          borderRadius="50%"
          bg={opacityFill}
          border={
            opacityFill === "transparent"
              ? `1px solid ${DEFAULT_BORDER}`
              : undefined
          }
        />
        <Text as="span" fontSize="9px" fontWeight={600} color={AUTHORED_COLOR}>
          {authoredCount}●
        </Text>
      </HStack>
      {expanded && (
        <Box
          position="absolute"
          top="-2px"
          left="8px"
          zIndex={10}
          bg="#12161f"
          border="1px solid #3182ce"
          borderRadius="5px"
          px="6px"
          py="4px"
        >
          <DotList
            patternSignals={patternSignals}
            effectSignals={effectSignals}
          />
        </Box>
      )}
    </Box>
  );
});

const DotList = function DotList({
  patternSignals,
  effectSignals,
}: {
  patternSignals: Signal[];
  effectSignals: Signal[];
}) {
  return (
    // pt gives the lane-on focus ring room so it isn't clipped by the header
    // above; no overflow clip here since narrow blocks collapse to a badge
    <HStack spacing="5px" px={2} pt="4px" pb="3px" width="max-content" align="center">
      {patternSignals.map((signal) => (
        <Dot key={signal.uniformName} signal={signal} />
      ))}
      {effectSignals.length > 0 && (
        <Box
          flexShrink={0}
          width="1px"
          height="11px"
          bg={DEFAULT_BORDER}
          mx="1px"
        />
      )}
      {effectSignals.map((signal) => (
        <Dot key={`${signal.block.id}:${signal.uniformName}`} signal={signal} />
      ))}
    </HStack>
  );
};

const Dot = function Dot({ signal }: { signal: Signal }) {
  const { authored, laneOn, isOpacity, fading, isEffect } = signal;

  const fill = isOpacity
    ? authored
      ? OPACITY_COLOR
      : fading
        ? FADING_COLOR
        : "transparent"
    : authored
      ? isEffect
        ? EFFECT_COLOR
        : AUTHORED_COLOR
      : "transparent";

  const filled = fill !== "transparent";
  const ringColor = isOpacity
    ? "rgba(49,130,206,.4)"
    : authored
      ? "rgba(237,137,54,.35)"
      : "rgba(113,128,150,.4)";

  const onClick = action((e: ReactMouseEvent) => {
    e.stopPropagation();
    signal.block.toggleParamLane(signal.uniformName);
  });

  const size = laneOn ? "10px" : "9px";
  return (
    <Tooltip
      label={signal.label}
      openDelay={0}
      hasArrow
      placement="top"
      fontSize="xs"
    >
      <Box
        as="span"
        flexShrink={0}
        onClick={onClick}
        width={size}
        height={size}
        bg={fill}
        border={filled ? undefined : `1px solid ${DEFAULT_BORDER}`}
        borderRadius={isEffect ? "2px" : "50%"}
        transform={isEffect ? "rotate(45deg)" : undefined}
        boxShadow={laneOn ? `0 0 0 2px ${ringColor}` : undefined}
        cursor="pointer"
      />
    </Tooltip>
  );
};
