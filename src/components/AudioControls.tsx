import { observer } from "mobx-react-lite";
import { IconButton } from "@chakra-ui/react";
import { BsSoundwave } from "react-icons/bs";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { AudioSelector } from "@/src/components/AudioSelector";
import { BeatMapControls } from "@/src/components/BeatMapControls";

export const AudioControls = observer(function AudioControls() {
  const store = useStore();
  const { uiStore } = store;

  return (
    <>
      <AudioSelector />
      <IconButton
        aria-label="Show waveform overlay"
        title="Show waveform overlay"
        height={6}
        icon={<BsSoundwave size={17} />}
        bgColor={uiStore.showingWaveformOverlay ? "orange.700" : undefined}
        _hover={
          uiStore.showingWaveformOverlay
            ? {
                bgColor: "orange.600",
              }
            : undefined
        }
        onClick={action(() => uiStore.toggleWaveformOverlay())}
      />
      <BeatMapControls />
    </>
  );
});
