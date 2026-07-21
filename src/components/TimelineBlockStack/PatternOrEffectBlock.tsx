import { Block } from "@/src/types/Block";
import { HStack, Heading } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { MouseEvent as ReactMouseEvent } from "react";
import { MdDragIndicator } from "react-icons/md";
import { HeaderRepeat } from "@/src/components/TimelineBlockStack/HeaderRepeat";
import { PatternTimingModal } from "@/src/components/TimelineBlockStack/PatternTimingModal";

type Props = {
  block: Block;
  handleBlockClick: (e: ReactMouseEvent) => void;
  isSelected: boolean;
};

// The pattern block's timeline header. Params and the effect chain live in the
// bottom device panel now, so this is just the draggable name row + timing.
export const PatternOrEffectBlock = observer(function PatternOrEffectBlock({
  block,
  handleBlockClick,
  isSelected,
}: Props) {
  const color = isSelected ? "blue.500" : "white";
  return (
    <HStack
      position="relative"
      pt={1}
      width="100%"
      className="handle"
      justify="space-evenly"
      cursor="grab"
      spacing={0}
      color={color}
      role="button"
      onClick={handleBlockClick}
    >
      <HeaderRepeat times={block.headerRepetitions}>
        <MdDragIndicator size={30} />
        <Heading
          size="md"
          userSelect="none"
          textOverflow="clip"
          overflowWrap="anywhere"
          color={color}
        >
          Pattern: {block.pattern.name}
        </Heading>
        <PatternTimingModal block={block} />
      </HeaderRepeat>
    </HStack>
  );
});
