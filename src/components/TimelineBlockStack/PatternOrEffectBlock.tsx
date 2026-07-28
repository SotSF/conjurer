import { Block } from "@/src/types/Block";
import { Box, Heading, HStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { MouseEvent as ReactMouseEvent } from "react";
import { MdDragIndicator } from "react-icons/md";
import { PatternTimingModal } from "@/src/components/TimelineBlockStack/PatternTimingModal";
import { TIMELINE_HEADER_WIDTH } from "@/src/types/UIStore";

type Props = {
  block: Block;
  handleBlockClick: (e: ReactMouseEvent) => void;
  isSelected: boolean;
};

/** Pattern name, then each effect in chain order — e.g. "Cloud · Kaleidoscope". */
export const blockHeaderLabel = (block: Block): string => {
  const effectNames = block.effectBlocks.map((effect) => effect.pattern.name);
  return effectNames.length > 0
    ? [block.pattern.name, ...effectNames].join(" · ")
    : block.pattern.name;
};

// The pattern block's timeline header: a draggable name pinned to the left of
// the visible timeline (stays in view when the block is scrolled wider than the
// viewport) and the timing control at the block's right edge.
// Observer so effect add/remove/reorder refreshes the label (pattern.name itself
// is excluded from Block's MobX tree and arrives via the parent re-render).
export const PatternOrEffectBlock = observer(function PatternOrEffectBlock({
  block,
  handleBlockClick,
  isSelected,
}: Props) {
  const color = isSelected ? "blue.500" : "white";
  const label = blockHeaderLabel(block);
  return (
    <HStack
      position="relative"
      width="100%"
      minH="26px"
      className="handle"
      cursor="grab"
      spacing={0}
      color={color}
      role="button"
      onClick={handleBlockClick}
    >
      {/* the name track is flex:1 and position:relative, so the sticky name is
          constrained to it and can never slide over the timing control */}
      <Box flex="1" minW={0} position="relative">
        <HStack
          position="sticky"
          left={`${TIMELINE_HEADER_WIDTH}px`}
          spacing={0}
          pl={1}
          // fit-content (not auto) so the sticky element is narrower than its
          // track and therefore has room to slide/pin as the card scrolls;
          // capped at the track width so it still truncates and never reaches
          // the timing control
          width="fit-content"
          maxW="100%"
        >
          <Box flexShrink={0} display="flex">
            <MdDragIndicator size={18} />
          </Box>
          {/* Narrow blocks: isTruncated + minW=0 let the label ellipsize inside
              the capped sticky track instead of overflowing into the timing
              control. Native title keeps the full "pattern · effects" string
              available on hover when the visible text is clipped. */}
          <Heading
            size="sm"
            fontSize="13px"
            userSelect="none"
            isTruncated
            minW={0}
            color={color}
            title={label}
          >
            {label}
          </Heading>
        </HStack>
      </Box>
      <Box flexShrink={0} pr={1}>
        <PatternTimingModal block={block} />
      </Box>
    </HStack>
  );
});
