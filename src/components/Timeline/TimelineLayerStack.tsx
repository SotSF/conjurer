import { observer } from "mobx-react-lite";
import { Box, Button, HStack, VStack } from "@chakra-ui/react";
import { action } from "mobx";
import { AiOutlinePlus } from "react-icons/ai";
import {
  DragDropContext,
  Droppable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";
import { useRef } from "react";
import { useStore } from "@/src/types/StoreContext";
import { PlayHead } from "@/src/components/PlayHead";
import { TimelineLayer } from "@/src/components/Timeline/TimelineLayer";
import { GlobalEffectRow } from "@/src/components/Timeline/GlobalEffectRow";
import { BeatGridOverlay } from "@/src/components/BeatGrid/BeatGridOverlay";
import { TIMELINE_HEADER_WIDTH } from "@/src/types/UIStore";
import { MAX_TIME } from "@/src/utils/time";
import { hoverHelpProps } from "@/src/utils/hoverHelp";

// Matches TimerAndWaveform's sticky header height so the layer stack can fill
// the remaining timeline viewport (playhead + empty-space seeking).
const TIMER_WAVEFORM_HEIGHT = 80;

export const TimelineLayerStack = observer(function TimelineLayerStack() {
  const store = useStore();
  const { audioStore, uiStore } = store;
  const stackRef = useRef<HTMLDivElement>(null);

  const onDragEnd: OnDragEndResponder = action((result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    store.reorderLayer(
      store.layers[result.source.index],
      result.destination.index,
    );
  });

  // Seek from clicks in empty space below/beside layers (the Add-layer row
  // spacer and the flex-grow filler). Layer content boxes still handle their
  // own seeks; this covers everything the playhead paints that isn't a layer.
  const seekFromClientX = action((clientX: number) => {
    const stackLeft = stackRef.current?.getBoundingClientRect().left ?? 0;
    audioStore.setTimeWithCursor(
      Math.max(
        0,
        uiStore.xToTime(clientX - stackLeft - TIMELINE_HEADER_WIDTH),
      ),
    );
    store.deselectAll();
  });

  // Read the observable array here in the observer's own render body (not inside
  // the Droppable render-prop, which runs in the library's render scope and
  // would leave this observer tracking nothing — so it wouldn't re-render when
  // layers load or change).
  const layerItems = store.layers.map((layer, index) => (
    <TimelineLayer key={layer.id} index={index} layer={layer} />
  ));

  return (
    <VStack
      ref={stackRef}
      position="relative"
      alignItems="flex-start"
      spacing={0}
      // Fill the timeline below the sticky waveform so the playhead and seek
      // hit-target extend into empty space when layers are short. When layers
      // are taller, content height wins and the playhead stretches with it.
      minHeight={`calc(100% - ${TIMER_WAVEFORM_HEIGHT}px)`}
    >
      <PlayHead />
      <BeatGridOverlay />
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="timeline-layers">
          {(provided) => (
            <VStack
              ref={provided.innerRef}
              {...provided.droppableProps}
              alignItems="flex-start"
              spacing={0}
            >
              {layerItems}
              {provided.placeholder}
            </VStack>
          )}
        </Droppable>
      </DragDropContext>
      <GlobalEffectRow />
      {/* Row spanning the FULL scroll width (the sticky header gutter + a spacer
          matching a layer's content width), mirroring a layer row. A plain
          width="100%" only spans the viewport-wide VStack, so the sticky box's
          containing block scrolls out of view and the button drifts off after
          ~one screen; the spacer keeps the containing block full-width so the
          button stays pinned across the whole horizontal scroll. */}
      <HStack spacing={0} flexShrink={0}>
        <Box
          position="sticky"
          left={0}
          zIndex={11}
          width={`${TIMELINE_HEADER_WIDTH}px`}
          flexShrink={0}
        >
          <Button
            width="100%"
            size="sm"
            variant="solid"
            bgColor="gray.700"
            color="gray.100"
            _hover={{ bgColor: "gray.600" }}
            borderRadius={0}
            leftIcon={<AiOutlinePlus size={16} />}
            onClick={action(() => {
              const layer = store.addLayer();
              // open the new layer's name field for immediate naming
              store.uiStore.layerIdToNameOnMount = layer.id;
            })}
            {...hoverHelpProps(
              uiStore,
              "Add layer",
              "Create a new timeline layer for stacking patterns.",
            )}
          >
            Add layer
          </Button>
        </Box>
        {/* spacer so the row is as wide as a layer's content, giving the sticky
            button room to stay pinned across the full horizontal scroll.
            Also seeks — clicking beside Add layer should move the playhead. */}
        <Box
          width={uiStore.timeToXPixels(MAX_TIME)}
          flexShrink={0}
          alignSelf="stretch"
          onClick={(e) => seekFromClientX(e.clientX)}
        />
      </HStack>
      {/* Fills leftover viewport height below the last layer / Add-layer row so
          clicks in the empty gray area seek like the timeline content does. */}
      <HStack spacing={0} flex="1 0 auto" alignSelf="stretch" minHeight={0}>
        <Box
          width={`${TIMELINE_HEADER_WIDTH}px`}
          flexShrink={0}
          alignSelf="stretch"
          onClick={(e) => seekFromClientX(e.clientX)}
        />
        <Box
          width={uiStore.timeToXPixels(MAX_TIME)}
          flexShrink={0}
          alignSelf="stretch"
          onClick={(e) => seekFromClientX(e.clientX)}
        />
      </HStack>
    </VStack>
  );
});
