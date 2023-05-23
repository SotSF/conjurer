import { Block } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { Box } from "@chakra-ui/react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";

type TimelineBlockProps = {
  block: Block;
  leftBound?: boolean;
  rightBound?: boolean;
};

export const TimelineBlockBound = observer(function TimelineBlockBound({
  block,
  leftBound,
  rightBound,
}: TimelineBlockProps) {
  const store = useStore();
  const { uiStore } = store;

  const dragNodeRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const handleDrag = (e: DraggableEvent, data: DraggableData) => {
    setPosition({ x: data.x, y: 0 });
  };

  const changeBound = (delta: number) => {
    if (leftBound) block.layer?.resizeBlockLeftBound(block, delta);
    else if (rightBound) block.layer?.resizeBlockRightBound(block, delta);
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
        left={leftBound ? 0 : "auto"}
        right={rightBound ? 0 : "auto"}
        zIndex={2}
        width="5px"
        height="100%"
        cursor="col-resize"
        borderRadius="5px"
        bgColor={dragging ? "gray.100" : "none"}
        onDoubleClick={() => {
          // on double click, snap bound to closest valid time 30s in whichever direction
          if (leftBound) changeBound(-30);
          else if (rightBound) changeBound(30);
        }}
      />
    </Draggable>
  );
});
