import { observer } from "mobx-react-lite";
import { Box } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { BeatGrid } from "@/src/components/BeatGrid";
import { useEffect, useState } from "react";
import { runInAction } from "mobx";

export const BeatGridOverlay = observer(function BeatGridOverlay() {
  const store = useStore();
  const { uiStore, audioStore } = store;
  const { showingBeatGridOverlay } = uiStore;

  useEffect(() => {
    // TODO: load this from a different source
    const songMetadata = localStorage.getItem("songMetadata");
    if (!songMetadata) return;

    const { songTempo, songTempoOffset } = JSON.parse(songMetadata);
    runInAction(() => {
      audioStore.songMetadata.tempo = songTempo;
      audioStore.songMetadata.tempoOffset = songTempoOffset;
    });
  }, [audioStore.songMetadata]);

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
        songTempo={audioStore.songMetadata.tempo}
        songTempoOffset={audioStore.songMetadata.tempoOffset}
        songDuration={audioStore.wavesurfer?.getDuration() ?? 0}
      />
    </Box>
  );
});
