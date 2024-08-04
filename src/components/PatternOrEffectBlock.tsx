import { Block } from "@/src/types/Block";
import { HStack, Heading, IconButton } from "@chakra-ui/react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { MouseEvent as ReactMouseEvent, useState } from "react";
import { MdDragIndicator } from "react-icons/md";
import { BsArrowsCollapse, BsArrowsExpand } from "react-icons/bs";
import { ParametersList } from "@/src/components/ParametersList";
import { RxCaretDown, RxCaretUp } from "react-icons/rx";
import { FaTrashAlt } from "react-icons/fa";
import { HeaderRepeat } from "@/src/components/HeaderRepeat";
import { ImLoop } from "react-icons/im";
import { useStore } from "@/src/types/StoreContext";
import PatternTimingModal from "./PatternTimingModal";

type Props = {
  block: Block;
  handleBlockClick: (e: ReactMouseEvent) => void;
  isSelected: boolean;
  effectIndex?: number;
};

export const PatternOrEffectBlock = observer(function PatternOrEffectBlock({
  block,
  handleBlockClick,
  isSelected,
  effectIndex = -1,
}: Props) {
  const { audioStore } = useStore();
  const [expandMode, setExpandMode] = useState<"expanded" | "collapsed">(
    "collapsed"
  );

  const parentBlock = block.parentBlock;
  const isEffect = parentBlock !== null;
  const lastEffectIndex =
    (isEffect ? parentBlock : block).effectBlocks.length - 1;

  const color = isSelected ? "blue.500" : "white";
  return (
    <>
      <HStack
        position="relative"
        pt={1}
        width="100%"
        borderTopWidth={isEffect ? 2 : 0}
        borderColor={color}
        borderStyle="solid"
        className={isEffect ? "" : "handle"}
        justify="space-evenly"
        cursor={isEffect ? "pointer" : "grab"}
        spacing={0}
        color={color}
        role="button"
        onClick={handleBlockClick}
      >
        <HeaderRepeat times={block.headerRepetitions}>
          {!isEffect && <MdDragIndicator size={30} />}
          <Heading
            size="md"
            userSelect="none"
            textOverflow="clip"
            overflowWrap="anywhere"
            color={color}
          >
            {isEffect ? "Effect" : "Pattern"}: {block.pattern.name}
          </Heading>
          <IconButton
            variant="ghost"
            size="xs"
            aria-label="Loop"
            title="Loop"
            height={6}
            icon={<ImLoop size={15} />}
            onClick={(e) => {
              audioStore.loopAudio(block.startTime, block.endTime);
              e.stopPropagation();
            }}
          />
          <IconButton
            variant="ghost"
            size="xs"
            aria-label="Collapse/Expand"
            title="Collapse/Expand"
            height={6}
            icon={
              expandMode === "collapsed" ? (
                <BsArrowsExpand size={15} />
              ) : (
                <BsArrowsCollapse size={15} />
              )
            }
            onClick={(e) => {
              setExpandMode(
                expandMode === "expanded" ? "collapsed" : "expanded"
              );
              e.stopPropagation();
            }}
          />
          {!isEffect && <PatternTimingModal block={block} />}
          {isEffect && (
            <HStack position="absolute" right={0}>
              {effectIndex < lastEffectIndex && (
                <IconButton
                  variant="link"
                  aria-label="Move down"
                  title="Move down"
                  height={6}
                  _hover={{ color: "blue.500" }}
                  icon={<RxCaretDown size={28} />}
                  onClick={action(() =>
                    parentBlock.reorderEffectBlock(block, 1)
                  )}
                />
              )}
              {effectIndex > 0 && (
                <IconButton
                  variant="link"
                  aria-label="Move up"
                  title="Move up"
                  height={6}
                  _hover={{ color: "blue.500" }}
                  icon={<RxCaretUp size={28} />}
                  onClick={action(() =>
                    parentBlock.reorderEffectBlock(block, -1)
                  )}
                />
              )}
              <IconButton
                variant="link"
                aria-label="Delete effect"
                title="Delete effect"
                height={6}
                _hover={{ color: "red.500" }}
                icon={<FaTrashAlt size={12} />}
                onClick={action(() => parentBlock.removeEffectBlock(block))}
              />
            </HStack>
          )}
        </HeaderRepeat>
      </HStack>
      <ParametersList expandMode={expandMode} block={block} />
    </>
  );
});
