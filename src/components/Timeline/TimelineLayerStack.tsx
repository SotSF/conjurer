import { observer } from "mobx-react-lite";
import { Box, Button, HStack, VStack } from "@chakra-ui/react";
import { action } from "mobx";
import { AiOutlinePlus } from "react-icons/ai";
import {
  DragDropContext,
  Droppable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";
import { useStore } from "@/src/types/StoreContext";
import { PlayHead } from "@/src/components/PlayHead";
import { TimelineLayer } from "@/src/components/Timeline/TimelineLayer";
import { BeatGridOverlay } from "@/src/components/BeatGridOverlay";
import { BEAT_GRID_UI_ENABLED } from "@/src/utils/featureFlags";
import { TIMELINE_HEADER_WIDTH } from "@/src/types/UIStore";
import { MAX_TIME } from "@/src/utils/time";

export const TimelineLayerStack = observer(function TimelineLayerStack() {
  const store = useStore();

  const onDragEnd: OnDragEndResponder = action((result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    store.reorderLayer(
      store.layers[result.source.index],
      result.destination.index,
    );
  });

  // Read the observable array here in the observer's own render body (not inside
  // the Droppable render-prop, which runs in the library's render scope and
  // would leave this observer tracking nothing — so it wouldn't re-render when
  // layers load or change).
  const layerItems = store.layers.map((layer, index) => (
    <TimelineLayer key={layer.id} index={index} layer={layer} />
  ));

  return (
    <VStack position="relative" alignItems="flex-start" spacing={0}>
      <PlayHead />
      {BEAT_GRID_UI_ENABLED && <BeatGridOverlay />}
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
      {/* Row spanning the FULL scroll width (the sticky header gutter + a spacer
          matching a layer's content width), mirroring a layer row. A plain
          width="100%" only spans the viewport-wide VStack, so the sticky box's
          containing block scrolls out of view and the button drifts off after
          ~one screen; the spacer keeps the containing block full-width so the
          button stays pinned across the whole horizontal scroll. */}
      <HStack spacing={0}>
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
          >
            Add layer
          </Button>
        </Box>
        {/* spacer so the row is as wide as a layer's content, giving the sticky
            button room to stay pinned across the full horizontal scroll */}
        <Box width={store.uiStore.timeToXPixels(MAX_TIME)} flexShrink={0} />
      </HStack>
    </VStack>
  );
});
