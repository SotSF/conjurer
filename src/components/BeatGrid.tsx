import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { Box } from "@chakra-ui/react";

const MAX_BEATS = 1500;

type BeatGridProps = {
  songTempo: number;
  songTempoOffset: number;
  songDuration: number;
  borderColor?: string;
};

export const BeatGrid = observer(function BeatGrid({
  songTempo,
  songTempoOffset,
  songDuration,
  borderColor,
}: BeatGridProps) {
  const store = useStore();
  const { uiStore } = store;

  const secondsPerBeat = 60 / songTempo;
  const numberOfBeats = Math.min(
    MAX_BEATS,
    Math.ceil(songDuration / secondsPerBeat),
  );

  return (
    <Box position="relative" height="100%">
      {!Number.isNaN(songTempoOffset) &&
        !Number.isNaN(songTempo) &&
        Array.from({ length: numberOfBeats }).map((_, index) => (
          <Box
            key={index}
            position="absolute"
            top={0}
            left={uiStore.timeToXPixels(
              songTempoOffset + (index * 60) / songTempo,
            )}
            width="0px"
            height="100%"
            borderLeftWidth={1}
            borderLeftStyle="solid"
            borderLeftColor={borderColor || "gray.500"}
            opacity={0.5}
          />
        ))}
    </Box>
  );
});
