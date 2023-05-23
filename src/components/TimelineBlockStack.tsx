import { Block } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { TimelineBlockBound } from "@/src/components/TimelineBlockBound";
import { Card } from "@chakra-ui/react";
import { action, computed } from "mobx";
import { observer } from "mobx-react-lite";
import {
  MouseEvent as ReactMouseEvent,
  useCallback,
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
  const { selectedBlocks, uiStore } = store;

  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const lastMouseDown = useRef(0);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const handleDrag = useCallback((e: DraggableEvent, data: DraggableData) => {
    // TODO: implement optional snapping here
    setPosition({ x: data.x, y: 0 });
  }, []);
  // handle moving a block to a new start time
  const handleDragStop = action((e: DraggableEvent, data: DraggableData) => {
    if (Math.abs(position.x) < 1) return;
    if (!patternBlock.layer) return;

    // prevent block overlaps for now by snapping to nearest valid start time
    const validTimeDelta = patternBlock.layer.nearestValidStartTimeDelta(
      patternBlock,
      uiStore.xToTime(position.x)
    );
    patternBlock.layer.changeBlockStartTime(
      patternBlock,
      patternBlock.startTime + validTimeDelta
    );
    setPosition({ x: 0, y: 0 });
  });

  const handleMouseDown = useCallback((e: MouseEvent) => {
    lastMouseDown.current = e.clientX;
  }, []);

  const handleBlockClick = useCallback(
    (e: ReactMouseEvent) => {
      if (Math.abs(e.clientX - lastMouseDown.current) > 5) return;

      if (selectedBlocks.has(patternBlock)) {
        store.deselectBlock(patternBlock);
      } else if (e.shiftKey) {
        store.addBlockToSelection(patternBlock);
      } else {
        store.selectBlock(patternBlock);
      }
      e.stopPropagation();
    },
    [store, patternBlock, selectedBlocks]
  );

  // cache this value, see https://mobx.js.org/computeds-with-args.html
  const isSelected = computed(() =>
    store.selectedBlocks.has(patternBlock)
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
        <TimelineBlockBound block={patternBlock} leftBound />
        <TimelineBlockBound block={patternBlock} rightBound />

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
