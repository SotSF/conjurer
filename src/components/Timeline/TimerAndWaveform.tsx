import { observer } from "mobx-react-lite";
import { HStack, VStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { WavesurferWaveform } from "@/src/components/Wavesurfer/WavesurferWaveform";
import { MAX_TIME } from "@/src/utils/time";
import { TimerReadout } from "@/src/components/Timeline/TimerReadout";
import { MarkerEditorModal } from "@/src/components/Timeline/MarkerEditorModal";
import { TimerControls } from "@/src/components/Timeline/TimerControls";

export const TimerAndWaveform = observer(function TimerAndWaveform() {
  const store = useStore();
  const { uiStore, embeddedViewer } = store;

  return (
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
        borderColor="black"
        spacing={0}
        width="150px"
        zIndex={18}
        bgColor="gray.500"
      >
        <TimerControls />
        {!embeddedViewer && <TimerReadout />}
      </VStack>

      <WavesurferWaveform />
      <MarkerEditorModal key={uiStore.markerToEdit.id} />
    </HStack>
  );
});
