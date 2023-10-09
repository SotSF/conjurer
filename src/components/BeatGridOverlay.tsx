import { observer } from "mobx-react-lite";
import { Box } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { BeatGrid } from "@/src/components/BeatGrid";

export const BeatGridOverlay = observer(function BeatGridOverlay() {
  const store = useStore();
  const { uiStore, audioStore, beatMapStore } = store;
  const { showingBeatGridOverlay } = uiStore;

  if (!showingBeatGridOverlay) return null;

  return (
    <Box
      position="absolute"
      top={0}
      left="150px"
      width="100%"
      height="100%"
      zIndex={1}
      pointerEvents={"none"}
      overflow="visible"
    >
      <BeatGrid
        songTempo={beatMapStore.beatMap.tempo}
        songTempoOffset={beatMapStore.beatMap.tempoOffset}
        songDuration={audioStore.wavesurfer?.getDuration() ?? 0}
      />
    </Box>
  );
});
