import { Block } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { Box } from "@chakra-ui/react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useRef, useState } from "react";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";

type TimelineBlockProps = {
  block: Block;
  bound: "left" | "right";
};

export const TimelineBlockBound = observer(function TimelineBlockBound({
  block,
  bound,
}: TimelineBlockProps) {
  const store = useStore();
  const { uiStore, audioStore } = store;

  const dragNodeRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const handleDrag = useCallback(
    (e: DraggableEvent, data: DraggableData) => {
      if (!uiStore.snappingToBeatGrid) {
        setPosition({ x: data.x, y: 0 });
        return;
      }

      if (bound === "left") {
        const hoveredTime = uiStore.xToTime(data.x) + block.startTime;
        console.log(hoveredTime);
        const nearestBeatTime =
          audioStore.songMetadata.nearestBeatTime(hoveredTime);
        const deltaTime = nearestBeatTime - block.startTime;
        const deltaPosition = uiStore.timeToX(deltaTime);
        setPosition({ x: deltaPosition, y: 0 });
      }
    },
    [uiStore, audioStore, block, bound]
  );

  const changeBound = (delta: number) => {
    if (bound === "left") block.layer?.resizeBlockLeftBound(block, delta);
    else if (bound === "right")
      block.layer?.resizeBlockRightBound(block, delta);
  };
  const handleStop = action(() => {
    changeBound(uiStore.xToTime(position.x));
    setPosition({ x: 0, y: 0 });
    setDragging(false);
  });

  return (
    <Draggable
      nodeRef={dragNodeRef}
      axis="x"
      onStart={() => setDragging(true)}
      onDrag={handleDrag}
      onStop={handleStop}
      position={position}
    >
      <Box
        ref={dragNodeRef}
        position="absolute"
        left={bound === "left" ? 0 : "auto"}
        right={bound === "right" ? 0 : "auto"}
        zIndex={2}
        width="5px"
        height="100%"
        cursor="col-resize"
        borderRadius="5px"
        bgColor={dragging ? "gray.100" : "none"}
        onDoubleClick={() => {
          // on double click, snap bound to closest valid time 30s in whichever direction
          if (bound === "left") changeBound(-30);
          else if (bound === "right") changeBound(30);
        }}
      />
    </Draggable>
  );
});
