import { observer } from "mobx-react-lite";
import { Box, HStack, VStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { PlayHead } from "@/src/components/PlayHead";
import { useEffect, useRef } from "react";
import { WavesurferWaveform } from "@/src/components/Wavesurfer/WavesurferWaveform";
import { MAX_TIME } from "@/src/utils/time";
import { TimelineLayer } from "@/src/components/TimelineLayer";
import { TimerReadout } from "@/src/components/TimerReadout";
import { MarkerEditorModal } from "@/src/components/MarkerEditorModal";
import { TimerControls } from "@/src/components/TimerControls";
import { useWheelZooming } from "@/src/hooks/wheelZooming";

export const Test = observer(function Test() {
  const store = useStore();
  const { uiStore, audioStore } = store;
  const timelineRef = useRef<HTMLDivElement>(null);

  useWheelZooming(timelineRef.current);

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      store.initializeClientSide();
    }
  }, [store]);

  useEffect(() => {
    audioStore.wavesurfer?.on("ready", () => {
      console.log("peaks", audioStore.peaks);
    });
  }, [audioStore.wavesurfer, audioStore.peaks]);

  return (
    <Box
      ref={timelineRef}
      position="relative"
      height="100%"
      overflow="scroll"
      overscrollBehavior="none"
    >
      <HStack
        position="sticky"
        top={0}
        width={uiStore.timeToXPixels(MAX_TIME)}
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
          borderBottomWidth={1}
          borderColor="black"
          spacing={0}
          width="150px"
          zIndex={18}
          bgColor="gray.500"
        >
          <TimerControls />
          <TimerReadout />
        </VStack>

        <WavesurferWaveform />
        <MarkerEditorModal key={uiStore.markerToEdit.id} />
      </HStack>
      {store.context !== "viewer" && (
        <VStack position="relative" alignItems="flex-start" spacing={0}>
          <PlayHead />
          {store.layers.map((layer, index) => (
            <TimelineLayer key={index} index={index} layer={layer} />
          ))}
        </VStack>
      )}
    </Box>
  );
});
