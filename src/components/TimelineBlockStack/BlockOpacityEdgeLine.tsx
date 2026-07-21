import { Block } from "@/src/types/Block";
import { opacityFadeExtents } from "@/src/utils/blockOpacity";
import { useStore } from "@/src/types/StoreContext";
import { Box } from "@chakra-ui/react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useRef, useState } from "react";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";

const LINE_COLOR = "#3182ce";

// A thin opacity ramp along the block's lower edge: it fades in on the left
// and/or out on the right wherever the block crossfades with a neighbor
// (auto-derived or manually authored). A draggable handle sits at each fade
// knee. Per-block — no stored overlap region.
export const BlockOpacityEdgeLine = observer(function BlockOpacityEdgeLine({
  block,
}: {
  block: Block;
}) {
  const { uiStore } = useStore();
  const { fadeInEnd, fadeOutStart } = opacityFadeExtents(block);

  // nothing to show when the block is at full opacity throughout
  if (fadeInEnd === null && fadeOutStart === null) return null;

  const width = uiStore.timeToX(block.duration);

  return (
    <Box position="relative" width="100%" height="8px" mt="-2px">
      {fadeInEnd !== null && (
        <Box
          position="absolute"
          bottom="2px"
          left={0}
          width={`${fadeInEnd * width}px`}
          height="3px"
          background={`linear-gradient(90deg, transparent, ${LINE_COLOR})`}
        />
      )}
      {fadeOutStart !== null && (
        <Box
          position="absolute"
          bottom="2px"
          left={`${fadeOutStart * width}px`}
          width={`${(1 - fadeOutStart) * width}px`}
          height="3px"
          background={`linear-gradient(90deg, ${LINE_COLOR}, transparent)`}
        />
      )}
      {fadeInEnd !== null && (
        <FadeHandle
          block={block}
          side="in"
          left={fadeInEnd * width}
        />
      )}
      {fadeOutStart !== null && (
        <FadeHandle
          block={block}
          side="out"
          left={fadeOutStart * width}
        />
      )}
    </Box>
  );
});

// plain (not observer): its render reads no observable; drag callbacks read the
// store lazily, and the parent re-renders it when the fade extents change
const FadeHandle = function FadeHandle({
  block,
  side,
  left,
}: {
  block: Block;
  side: "in" | "out";
  left: number;
}) {
  const { uiStore } = useStore();
  const dragNodeRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleDrag = useCallback(
    (e: DraggableEvent, data: DraggableData) => setPosition({ x: data.x, y: 0 }),
    [],
  );
  const handleStop = action(() => {
    block.adjustOpacityFade(side, uiStore.xToTime(position.x));
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
        position="absolute"
        bottom="0px"
        left={`${left - 4}px`}
        width="8px"
        height="8px"
        borderRadius="50%"
        bg="#12161f"
        border="2px solid #4aa3ff"
        cursor="col-resize"
        title={side === "in" ? "Drag fade-in" : "Drag fade-out"}
        onClick={(e) => e.stopPropagation()}
      />
    </Draggable>
  );
};
