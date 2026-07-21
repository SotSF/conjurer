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

// The pattern block's timeline header: a draggable name pinned to the left of
// the visible timeline (stays in view when the block is scrolled wider than the
// viewport) and the timing control at the block's right edge.
export const PatternOrEffectBlock = observer(function PatternOrEffectBlock({
  block,
  handleBlockClick,
  isSelected,
}: Props) {
  const color = isSelected ? "blue.500" : "white";
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
          maxW="100%"
        >
          <Box flexShrink={0} display="flex">
            <MdDragIndicator size={18} />
          </Box>
          <Heading size="sm" fontSize="13px" userSelect="none" isTruncated color={color}>
            {block.pattern.name}
          </Heading>
        </HStack>
      </Box>
      <Box flexShrink={0} pr={1}>
        <PatternTimingModal block={block} />
      </Box>
    </HStack>
  );
});
