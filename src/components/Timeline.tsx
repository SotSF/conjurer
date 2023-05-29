import { observer } from "mobx-react-lite";
import { Box, Grid, GridItem, HStack, Text, VStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { PlayHead } from "@/src/components/PlayHead";
import { useRef } from "react";
import { useWheelZooming } from "@/src/hooks/wheelZooming";
import { WavesurferWaveform } from "@/src/components/WavesurferWaveform";
import { MAX_TIME } from "@/src/utils/time";
import { TimelineLayer } from "@/src/components/TimelineLayer";
import { TimerReadout } from "@/src/components/TimerReadout";

export const Timeline = observer(function Timeline() {
  const store = useStore();
  const { uiStore } = store;
  const timelineRef = useRef<HTMLDivElement>(null);

  useWheelZooming(timelineRef.current);

  return (
    <Box
      ref={timelineRef}
      position="relative"
      height="100%"
      overflow="scroll"
      overscrollBehavior="none"
      onClick={store.deselectAllBlocks}
    >
      <HStack
        position="sticky"
        top={0}
        width={uiStore.timeToXPixels(MAX_TIME)}
        spacing={0}
        zIndex={12}
      >
        <TimerReadout />
        <Box height={10} width="100%" bgColor="gray.500">
          <WavesurferWaveform />
          <PlayHead />
        </Box>
      </HStack>
      <HStack alignItems="flex-start" spacing={0}>
        <VStack spacing={0}>
          {store.layers.map((layer, index) => (
            <TimelineLayer key={index} index={index} layer={layer} />
          ))}
        </VStack>
      </HStack>
    </Box>
  );
});
