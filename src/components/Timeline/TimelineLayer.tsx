import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { Box, HStack } from "@chakra-ui/react";
import { MAX_TIME } from "@/src/utils/time";
import { Layer } from "@/src/types/Layer";
import { action } from "mobx";
import { useRef } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { TimelineLayerHeader } from "@/src/components/Timeline/TimelineLayerHeader";
import { TimelineBlockStack } from "@/src/components/TimelineBlockStack/TimelineBlockStack";
import { TimelineEffectChainStrip } from "@/src/components/Timeline/TimelineEffectChainStrip";

type TimelineLayerProps = {
  index: number;
  layer: Layer;
};

export const TimelineLayer = observer(function TimelineLayer({
  index,
  layer,
}: TimelineLayerProps) {
  const store = useStore();
  const { uiStore, audioStore, selectedLayer } = store;

  const boxRef = useRef<HTMLDivElement>(null);

  const bgColor = selectedLayer === layer ? "gray.300" : "gray.400";

  // Read observables here in the observer's own render body, NOT inside the
  // @hello-pangea/dnd Draggable render-prop below (which runs in the library's
  // render scope and would leave this observer tracking nothing — so it
  // wouldn't re-render when e.g. layer.height grows as a param lane opens).
  // Same footgun the TimelineLayerStack observer hit; see commit 573059d.
  const layerHeight = layer.height;
  const collapsed = layer.collapsed;
  const contentWidth = uiStore.timeToXPixels(MAX_TIME);
  // when collapsed the row shrinks to its header and the blocks are hidden from
  // the timeline (the layer still renders to the canopy — that's `visible`)
  // Every block stays mounted. Unmounting off-screen blocks was tried and
  // reverted: it made zoom only ~14% cheaper on a dense viewport, but scrolling
  // then had to build blocks on the scroll frame — a sustained scroll into dense
  // content went from a 183ms worst frame to 5,887ms. Blocks that are mounted
  // but off screen cost nothing to scroll past, because nothing re-renders.
  const blockStacks = collapsed
    ? null
    : layer
        .getAllBlocks()
        .map((block) => (
          <TimelineBlockStack key={block.id} patternBlock={block} />
        ));
  const effectChainStrip =
    collapsed || !layer.effectChain ? null : (
      <TimelineEffectChainStrip
        chain={layer.effectChain}
        topOffset={layer.blockLanesHeight}
      />
    );

  return (
    <Draggable
      draggableId={layer.id}
      index={index}
      // reordering is only meaningful with more than one layer
      isDragDisabled={store.layers.length < 2}
    >
      {(provided, snapshot) => (
        <HStack
          ref={provided.innerRef}
          {...provided.draggableProps}
          position="relative"
          height={`${layerHeight}px`}
          alignItems="flex-start"
          spacing={0}
          boxShadow={snapshot.isDragging ? "dark-lg" : undefined}
          onClick={action(() => {
            store.selectedLayer = layer;
          })}
        >
          <TimelineLayerHeader
            index={index}
            layer={layer}
            dragHandleProps={provided.dragHandleProps}
          />
          <Box
            ref={boxRef}
            id={`timeline-layer-${layer.id}`}
            position="relative"
            width={contentWidth}
            height="100%"
            boxSizing="border-box"
            bgColor={bgColor}
            borderTopWidth={1}
            borderColor="black"
            borderStyle={index === 0 ? "solid" : "dotted"}
            onClick={action((e) => {
              audioStore.setTimeWithCursor(
                Math.max(
                  0,
                  uiStore.xToTime(
                    e.clientX - boxRef.current!.getBoundingClientRect().x,
                  ),
                ),
              );
              store.deselectAll();
            })}
          >
            {blockStacks}
            {effectChainStrip}
          </Box>
        </HStack>
      )}
    </Draggable>
  );
});
