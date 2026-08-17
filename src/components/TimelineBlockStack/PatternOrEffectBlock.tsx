import { Block } from "@/src/types/Block";
import { Box, Heading, HStack, IconButton } from "@chakra-ui/react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { MouseEvent as ReactMouseEvent } from "react";
import { FaLock, FaPencilAlt, FaSearch, FaUnlock } from "react-icons/fa";
import { MdDragIndicator } from "react-icons/md";
import { PatternTimingModal } from "@/src/components/TimelineBlockStack/PatternTimingModal";
import { TIMELINE_HEADER_WIDTH } from "@/src/types/UIStore";
import { useStore } from "@/src/types/StoreContext";
import { hoverHelpProps } from "@/src/utils/hoverHelp";
import { loadBlockIntoPlayground } from "@/src/utils/loadBlockIntoPlayground";

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
// the visible timeline and zoom/timing controls pinned to the right, so both
// stay on-screen when the block is wider than the viewport.
// Observer so effect add/remove/reorder refreshes the label (pattern.name itself
// is excluded from Block's MobX tree and arrives via the parent re-render).
export const PatternOrEffectBlock = observer(function PatternOrEffectBlock({
  block,
  handleBlockClick,
  isSelected,
}: Props) {
  const store = useStore();
  const { uiStore, playgroundStore } = store;
  const color = isSelected ? "blue.500" : "white";
  const label = blockHeaderLabel(block);
  const locked = block.locked;
  // The playground is keyed by pattern, so a block whose pattern has no
  // playground counterpart — an effect chain block, whose source is the chain's
  // composited input — has nothing to open.
  const editableInPlayground = playgroundStore.patternBlocks.some(
    (playgroundBlock) => playgroundBlock.pattern.name === block.pattern.name,
  );
  return (
    <HStack
      position="relative"
      width="100%"
      minH="26px"
      className={locked ? undefined : "handle"}
      cursor={locked ? "default" : "grab"}
      spacing={0}
      color={color}
      role="button"
      onClick={handleBlockClick}
    >
      {/* the name track is flex:1 and position:relative, so the sticky name is
          constrained to it and can never slide over the controls' layout slot */}
      <Box flex="1" minW={0} position="relative">
        <HStack
          position="sticky"
          left={`${TIMELINE_HEADER_WIDTH}px`}
          spacing={0}
          pl={1}
          // fit-content (not auto) so the sticky element is narrower than its
          // track and therefore has room to slide/pin as the card scrolls;
          // capped at the track width so it still truncates and never reaches
          // the controls' layout slot at the block's right edge
          width="fit-content"
          maxW="100%"
        >
          <Box flexShrink={0} display="flex">
            <MdDragIndicator size={18} />
          </Box>
          {/* Narrow blocks: isTruncated + minW=0 let the label ellipsize inside
              the capped sticky track instead of overflowing into the controls.
              Native title keeps the full "pattern · effects" string available
              on hover when the visible text is clipped. */}
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
      {/* Sticky to the timeline viewport's right edge so zoom/timing stay
          reachable on wide blocks; slides left over the header as you scroll. */}
      <HStack
        flexShrink={0}
        spacing={0}
        pr={1}
        pl={1}
        position="sticky"
        right={0}
        zIndex={2}
        alignSelf="stretch"
        bg="gray.700"
      >
        {editableInPlayground && (
          <IconButton
            variant="ghost"
            size="xs"
            aria-label="Edit in playground"
            title="Edit in playground"
            height={6}
            icon={<FaPencilAlt size={11} />}
            onClick={action((e: ReactMouseEvent) => {
              e.stopPropagation();
              if (!loadBlockIntoPlayground(playgroundStore, block)) return;
              store.pause();
              uiStore.patternDrawerOpen = true;
            })}
            {...hoverHelpProps(
              uiStore,
              "Edit in playground",
              "Open the playground with this block's pattern, effects, and parameter values.",
            )}
          />
        )}
        {uiStore.canTimelineZoom && (
          <IconButton
            variant="ghost"
            size="xs"
            aria-label="Zoom to block"
            title="Zoom to block"
            height={6}
            icon={<FaSearch size={12} />}
            onClick={action((e: ReactMouseEvent) => {
              e.stopPropagation();
              uiStore.fitBlockInView(block);
            })}
            {...hoverHelpProps(
              uiStore,
              "Zoom to block",
              "Fit this block in the timeline viewport.",
            )}
          />
        )}
        <PatternTimingModal block={block} />
        <IconButton
          variant="ghost"
          size="xs"
          aria-label={locked ? "Unlock block" : "Lock block"}
          title={locked ? "Unlock block" : "Lock block"}
          height={6}
          color={locked ? "yellow.300" : undefined}
          icon={locked ? <FaLock size={11} /> : <FaUnlock size={11} />}
          onClick={action((e: ReactMouseEvent) => {
            e.stopPropagation();
            block.toggleLocked();
          })}
          {...hoverHelpProps(
            uiStore,
            locked ? "Unlock block" : "Lock block",
            locked
              ? "Allow dragging and resizing this block in time on the timeline."
              : "Prevent accidental dragging and resizing — lock this block's position in time.",
          )}
        />
      </HStack>
    </HStack>
  );
});
