import { ExtraParams } from "@/src/types/PatternParams";
import { Box } from "@chakra-ui/react";
import { memo, useCallback, useRef, useState } from "react";
import { Variation } from "@/src/types/Variations/Variation";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import { useStore } from "@/src/types/StoreContext";
import { Block } from "@/src/types/Block";
import { action } from "mobx";
import { VARIATION_BOUND_WIDTH } from "@/src/utils/layout";

type ParameterProps = {
  uniformName: string;
  block: Block<ExtraParams>;
  variation: Variation;
};

export const VariationBound = memo(function VariationBound({
  uniformName,
  block,
  variation,
}: ParameterProps) {
  const store = useStore();
  const { uiStore, audioStore } = store;

  const dragNodeRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const handleDrag = useCallback(
    (e: DraggableEvent, data: DraggableData) => {
      if (!uiStore.snappingToBeatGrid) {
        setPosition({ x: data.x, y: 0 });
        return;
      }

      // const hoveredTime = uiStore.xToTime(data.x) + patternBlock.startTime;
      // const nearestBeatTime =
      //   audioStore.songMetadata.nearestBeatTime(hoveredTime);
      // const deltaTime = nearestBeatTime - patternBlock.startTime;
      // const deltaPosition = uiStore.timeToX(deltaTime);
      // setPosition({ x: deltaPosition, y: 0 });
    },
    [uiStore, audioStore]
  );
  const handleStop = action(() => {
    block.applyVariationDurationDelta(
      uniformName,
      variation,
      store.uiStore.xToTime(position.x)
    );
    setPosition({ x: 0, y: 0 });
  });
  const handleDoubleClick = action(() => {
    block.applyMaxVariationDurationDelta(uniformName, variation);
    setPosition({ x: 0, y: 0 });
  });

  return (
    <Draggable
      nodeRef={dragNodeRef}
      axis="x"
      onDrag={handleDrag}
      onStop={handleStop}
      position={position}
    >
      <Box
        ref={dragNodeRef}
        width={`${VARIATION_BOUND_WIDTH}px`}
        height="60px"
        boxSizing="border-box"
        borderRightWidth={VARIATION_BOUND_WIDTH}
        borderColor="gray.500"
        borderStyle="solid"
        cursor="col-resize"
        borderRadius="5px"
        onDoubleClick={handleDoubleClick}
      />
    </Draggable>
  );
});
