import { Block } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { TimelineBlockBound } from "@/src/components/TimelineBlockBound";
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
import { PatternOrEffectBlock } from "@/src/components/PatternOrEffectBlock";
import { AddEffectButton } from "@/src/components/AddEffectButton";

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
    new ResizeObserver(
      action(() => {
        // recompute the height of the layer
        patternBlock.layer?.recomputeHeight();

        // recompute the number of header repetitions
        patternBlock.recomputeHeaderRepetitions(
          dragNodeRef.current?.clientWidth ?? 0
        );
      })
    ).observe(dragNodeRef.current);
  }, [dragNodeRef, patternBlock.layer, patternBlock]);

  const lastMouseDown = useRef(0);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const handleDrag = useCallback(
    (e: DraggableEvent, data: DraggableData) => {
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
    [uiStore, beatMapStore, patternBlock]
  );
  // handle moving a block to a new start time
  const handleDragStop = action((e: DraggableEvent, data: DraggableData) => {
    if (Math.abs(position.x) < 1) return;
    if (!patternBlock.layer) return;

    patternBlock.layer.attemptMoveBlock(
      patternBlock,
      uiStore.xToTime(position.x)
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
            blockOrVariation.block === patternBlock
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
    [store, patternBlock, selectedBlocksOrVariations]
  );

  // cache this value, see https://mobx.js.org/computeds-with-args.html
  const isSelected = computed(
    () =>
      !!Array.from(store.selectedBlocksOrVariations).find(
        (blockOrVariation) =>
          blockOrVariation.type === "block" &&
          blockOrVariation.block === patternBlock
      )
  ).get();

  return (
    <Draggable
      nodeRef={dragNodeRef}
      handle=".handle"
      axis="x"
      bounds="parent"
      onDrag={handleDrag}
      onStop={handleDragStop}
      position={position}
      onMouseDown={handleMouseDown}
    >
      <Card
        ref={dragNodeRef}
        position="absolute"
        top={0}
        left={uiStore.timeToXPixels(patternBlock.startTime)}
        width={uiStore.timeToXPixels(patternBlock.duration)}
        border="solid"
        borderColor={isSelected ? "blue.500" : "white"}
        borderWidth={3}
        alignItems="center"
        onClick={(e: ReactMouseEvent) => e.stopPropagation()}
      >
        <TimelineBlockBound block={patternBlock} bound="left" />
        <TimelineBlockBound block={patternBlock} bound="right" />

        <PatternOrEffectBlock
          block={patternBlock}
          handleBlockClick={handleBlockClick}
          isSelected={isSelected}
        />
        {patternBlock.effectBlocks.map((effectBlock, index) => (
          <PatternOrEffectBlock
            key={effectBlock.id}
            block={effectBlock}
            effectIndex={index}
            handleBlockClick={handleBlockClick}
            isSelected={isSelected}
          />
        ))}
        <AddEffectButton block={patternBlock} isSelected={isSelected} />
      </Card>
    </Draggable>
  );
});
