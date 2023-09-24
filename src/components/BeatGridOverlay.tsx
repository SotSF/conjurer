import { observer } from "mobx-react-lite";
import { Box } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { BeatGrid } from "@/src/components/BeatGrid";
import { useEffect, useState } from "react";

export const BeatGridOverlay = observer(function BeatGridOverlay() {
  const store = useStore();
  const { uiStore, audioStore } = store;
  const { showingBeatGridOverlay } = uiStore;

  const [songTempo, setSongTempo] = useState(120);
  const [songTempoOffset, setSongTempoOffset] = useState(0);

  useEffect(() => {
    // TODO: load this from a different source
    const songMetadata = localStorage.getItem("songMetadata");
    if (!songMetadata) return;

    const { songTempo, songTempoOffset } = JSON.parse(songMetadata);
    setSongTempo(songTempo);
    setSongTempoOffset(songTempoOffset);
  }, []);

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
        songTempo={songTempo}
        songTempoOffset={songTempoOffset}
        songDuration={audioStore.wavesurfer?.getDuration() ?? 0}
      />
    </Box>
  );
});
