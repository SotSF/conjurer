import { observer } from "mobx-react-lite";
import { HStack, VStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { LazyWavesurferWaveform } from "@/src/components/Wavesurfer/LazyWavesurferWaveform";
import { MAX_TIME } from "@/src/utils/time";
import { TimerReadout } from "@/src/components/Timeline/TimerReadout";
import { TimerControls } from "@/src/components/Timeline/TimerControls";

export const TimerAndWaveform = observer(function TimerAndWaveform() {
  const store = useStore();
  const { uiStore } = store;

  const width = uiStore.canTimelineZoom
    ? uiStore.timeToXPixels(MAX_TIME)
    : "100%";

  return (
    <HStack
      position="sticky"
      top={0}
      width={width}
      maxWidth={width}
      spacing={0}
      zIndex={12}
    >
      <VStack
        position="sticky"
        top={0}
        left={0}
        flexShrink={0}
        boxSizing="border-box"
        borderRightWidth={1}
        borderColor="black"
        spacing={0}
        width="150px"
        height="80px"
        zIndex={18}
        bgColor="gray.500"
      >
        <TimerReadout />
        <TimerControls />
      </VStack>

      <LazyWavesurferWaveform />
    </HStack>
  );
});
