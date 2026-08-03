import { Block } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { TimelineBlockBound } from "@/src/components/TimelineBlockStack/TimelineBlockBound";
import { Card } from "@chakra-ui/react";
import { action, computed } from "mobx";
import { observer } from "mobx-react-lite";
import {
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Draggable from "react-draggable";
import { DraggableData } from "react-draggable";
import { DraggableEvent } from "react-draggable";
import {
  PatternOrEffectBlock,
  blockHeaderLabel,
} from "@/src/components/TimelineBlockStack/PatternOrEffectBlock";
import { BlockDotRow } from "@/src/components/TimelineBlockStack/BlockDotRow";
import { BlockAutomationLanes } from "@/src/components/TimelineBlockStack/BlockAutomationLanes";
import { BlockOpacityEdgeLine } from "@/src/components/TimelineBlockStack/BlockOpacityEdgeLine";
import { hoverHelpProps } from "@/src/utils/hoverHelp";

// Narrower than this (in CSS pixels) a block's automation lanes can't be read or
// interacted with, so they aren't rendered. See the render site below. Tuned so
// lanes still appear at moderate zoom on short (~1s) blocks, and drop out only
// when zoomed far enough out that a lane would be a few pixels of noise.
const MIN_WIDTH_FOR_AUTOMATION_LANES = 64;

type Props = {
  patternBlock: Block;
};

export const TimelineBlockStack = observer(function TimelineBlockStack({
  patternBlock,
}: Props) {
  const store = useStore();
  const { selectedBlocksOrVariations, uiStore, beatMapStore } = store;

  const dragNodeRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!dragNodeRef.current) return;

    // Anytime the TimelineBlockStack is resized,
    const observer = new ResizeObserver(
      action(() => {
        // report the block's height so the layer can size its lanes
        patternBlock.layer?.reportBlockHeight(
          patternBlock,
          dragNodeRef.current?.offsetHeight ?? 0,
        );

        // recompute the number of header repetitions
        patternBlock.recomputeHeaderRepetitions(
          dragNodeRef.current?.clientWidth ?? 0,
        );
      }),
    );
    observer.observe(dragNodeRef.current);
    // Without this the observer outlives the effect: the deps include
    // patternBlock.layer, so a block moved between layers left its old observer
    // attached and firing forever (328 observers existed for 154 blocks).
    return () => observer.disconnect();
  }, [dragNodeRef, patternBlock.layer, patternBlock]);

  const lastMouseDown = useRef(0);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const handleDrag = useCallback(
    (e: DraggableEvent, data: DraggableData) => {
      // rango voice commands (which are not trusted) should not trigger dragging
      if (!e.isTrusted) return;

      if (!uiStore.snappingToBeatGrid) {
        setPosition({ x: data.x, y: 0 });
        return;
      }

      const hoveredTime = uiStore.xToTime(data.x) + patternBlock.startTime;
      const nearestBeatTime = beatMapStore.beatMap.nearestBeatTime(hoveredTime);
      const deltaTime = nearestBeatTime - patternBlock.startTime;
      const deltaPosition = uiStore.timeToX(deltaTime);
      setPosition({ x: deltaPosition, y: 0 });
    },
    [uiStore, beatMapStore, patternBlock],
  );
  // handle moving a block to a new start time
  const handleDragStop = action((e: DraggableEvent, data: DraggableData) => {
    if (Math.abs(position.x) < 1) return;
    if (!patternBlock.layer) return;

    patternBlock.layer.attemptMoveBlock(
      patternBlock,
      uiStore.xToTime(position.x),
      true,
    );
    setPosition({ x: 0, y: 0 });
  });

  const handleMouseDown = useCallback((e: MouseEvent) => {
    lastMouseDown.current = e.clientX;
  }, []);

  const handleBlockClick = useCallback(
    (e: ReactMouseEvent) => {
      if (Math.abs(e.clientX - lastMouseDown.current) > 5) return;

      if (
        Array.from(selectedBlocksOrVariations).find(
          (blockOrVariation) =>
            blockOrVariation.type === "block" &&
            blockOrVariation.block === patternBlock,
        )
      ) {
        store.deselectBlock(patternBlock);
      } else if (e.shiftKey) {
        store.addBlockToSelection(patternBlock);
      } else {
        store.selectBlock(patternBlock);
      }

      if (patternBlock.layer) store.selectedLayer = patternBlock.layer;
      e.stopPropagation();
    },
    [store, patternBlock, selectedBlocksOrVariations],
  );

  // block width in CSS pixels at the current zoom, for level-of-detail choices
  const renderedWidth = uiStore.timeToX(patternBlock.duration);
  const lanesNearView = uiStore.isTimeSpanNearView(
    patternBlock.startTime,
    patternBlock.endTime,
  );

  // The block's zoom-dependent geometry. Passing these through Chakra props
  // makes emotion serialize and inject a NEW CSS class for every card on every
  // zoom change; a plain inline style bypasses that entirely.
  const geometry = {
    top: `${patternBlock.layer?.blockTopOffset(patternBlock) ?? 0}px`,
    left: uiStore.timeToXPixels(patternBlock.startTime),
    width: uiStore.timeToXPixels(patternBlock.duration),
  };

  // cache this value, see https://mobx.js.org/computeds-with-args.html
  const isSelected = computed(
    () =>
      !!Array.from(store.selectedBlocksOrVariations).find(
        (blockOrVariation) =>
          blockOrVariation.type === "block" &&
          blockOrVariation.block === patternBlock,
      ),
  ).get();

  const locked = patternBlock.locked;

  return (
    <Draggable
      nodeRef={dragNodeRef}
      handle=".handle"
      axis="x"
      bounds="parent"
      disabled={locked}
      onDrag={handleDrag}
      onStop={handleDragStop}
      position={position}
      onMouseDown={handleMouseDown}
    >
      <Card
        ref={dragNodeRef}
        position="absolute"
        // NB: a plain inline style, deliberately not Chakra props — see the
        // comment where `geometry` is built. react-draggable merges this with
        // its own transform, so both survive.
        style={geometry}
        border="solid"
        borderColor={isSelected ? "blue.500" : "white"}
        borderWidth={3}
        alignItems="center"
        // allow the automation-lane gutter labels and the narrow-block dot-row
        // popover to render just outside the block's own width
        overflow="visible"
        // react-draggable's transform gives every block its own stacking context,
        // so the narrow-block dot-row popover's z-index can only rank within its
        // own card — it can't rise above a sibling block unless the CARD itself
        // does. Bump the card above default-stacked siblings while hovered or
        // selected (the same condition that expands the popover).
        zIndex={isSelected ? 5 : undefined}
        _hover={{ zIndex: 5 }}
        onClick={(e: ReactMouseEvent) => e.stopPropagation()}
        {...hoverHelpProps(
          uiStore,
          blockHeaderLabel(patternBlock),
          locked
            ? "Pattern block — locked in time. Unlock via the lock icon to drag."
            : "Pattern block — drag to move in time. Click to select; Shift+click to multi-select.",
        )}
      >
        <TimelineBlockBound block={patternBlock} bound="left" />
        <TimelineBlockBound block={patternBlock} bound="right" />

        <PatternOrEffectBlock
          block={patternBlock}
          handleBlockClick={handleBlockClick}
          isSelected={isSelected}
        />
        {/* params and the effect chain now live in the bottom device panel;
            the block itself carries the glanceable dot-row, opacity edge-line,
            and the automation lanes for armed params */}
        <BlockDotRow block={patternBlock} isSelected={isSelected} />
        <BlockOpacityEdgeLine block={patternBlock} />
        {/* Level of detail, on two axes:
            - Width: below a few dozen pixels a lane's curve, region tabs and
              labels are neither readable nor clickable, but they still cost a
              full render every time the zoom changes. Zoomed far out that is
              every block in the experience at once.
            - Proximity to the view: without this, crossing the width threshold
              while zooming mounts every armed lane in the experience in a single
              frame — measured at ~30,000 nodes and a 23 SECOND stall on an
              experience with 556 armed lanes. Bounding it to roughly what's on
              screen keeps the mount cost proportional to the viewport instead of
              to the whole timeline. */}
        {renderedWidth >= MIN_WIDTH_FOR_AUTOMATION_LANES && lanesNearView && (
          <BlockAutomationLanes block={patternBlock} />
        )}
      </Card>
    </Draggable>
  );
});
