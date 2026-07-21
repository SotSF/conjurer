import { observer } from "mobx-react-lite";
import { VStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { PlayHead } from "@/src/components/PlayHead";
import { TimelineLayer } from "@/src/components/Timeline/TimelineLayer";
import { BeatGridOverlay } from "@/src/components/BeatGridOverlay";
import { BEAT_GRID_UI_ENABLED } from "@/src/utils/featureFlags";

export const TimelineLayerStack = observer(function TimelineLayerStack() {
  const store = useStore();

  return (
    <VStack position="relative" alignItems="flex-start" spacing={0}>
      <PlayHead />
      {BEAT_GRID_UI_ENABLED && <BeatGridOverlay />}
      {store.layers.map((layer, index) => (
        <TimelineLayer key={layer.id} index={index} layer={layer} />
      ))}
    </VStack>
  );
});
