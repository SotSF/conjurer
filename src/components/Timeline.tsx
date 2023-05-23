import { observer } from "mobx-react-lite";
import { Box } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { PlayHead } from "@/src/components/PlayHead";
import { useRef } from "react";
import { useWheelZooming } from "@/src/hooks/wheelZooming";
import { WavesurferWaveform } from "@/src/components/WavesurferWaveform";
import { MAX_TIME } from "@/src/utils/time";
import { TimelineLayer } from "@/src/components/TimelineLayer";

export const Timeline = observer(function Timeline() {
  const store = useStore();
  const { uiStore } = store;
  const timelineRef = useRef<HTMLDivElement>(null);

  useWheelZooming(timelineRef.current);

  return (
    <Box
      ref={timelineRef}
      height="100%"
      overflow="scroll"
      overscrollBehavior="none"
      onClick={store.deselectAllBlocks}
    >
      <Box
        position="sticky"
        top={0}
        height={10}
        width={uiStore.timeToXPixels(MAX_TIME)}
        bgColor="gray.500"
        zIndex={10}
      >
        <WavesurferWaveform />
        <PlayHead />
      </Box>
      {store.layers.map((layer, index) => (
        <TimelineLayer key={index} layer={layer} />
      ))}
    </Box>
  );
});
