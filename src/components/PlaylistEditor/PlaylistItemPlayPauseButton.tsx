import { Box, Button, HStack, IconButton, Spinner } from "@chakra-ui/react";
import { FaPause, FaPlay } from "react-icons/fa";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";

type PlaylistItemPlayPauseButtonProps = {
  index: number;
  isSelected: boolean;
  loadingExperience: boolean;
  onPlayClick: () => void;
  onPauseClick: () => void;
};

export const PlaylistItemPlayPauseButton = observer(
  function PlaylistItemPlayPauseButton({
    index,
    isSelected,
    loadingExperience,
    onPlayClick,
    onPauseClick,
  }: PlaylistItemPlayPauseButtonProps) {
    const store = useStore();
    const { audioStore } = store;

    let playPauseButton = null;
    if (isSelected) {
      // If experience is selected and loading, show spinner
      if (loadingExperience || !audioStore.audioReady)
        playPauseButton = <Spinner size="sm" />;
      // If experience is selected and not loading, show play/pause button
      else
        playPauseButton = (
          <IconButton
            variant="unstyled"
            aria-label="Play"
            title="Play"
            color={store.playing ? "orange" : "green"}
            height={6}
            icon={
              <HStack justify="center">
                {store.playing ? <FaPause size={10} /> : <FaPlay size={10} />}
              </HStack>
            }
            onClick={store.playing ? onPauseClick : onPlayClick}
          />
        );
    } else {
      // If experience is not selected, show play button
      playPauseButton = (
        <IconButton
          variant="unstyled"
          aria-label="Play"
          title="Play"
          color="green"
          height={6}
          icon={
            <HStack justify="center">
              <FaPlay size={10} />
            </HStack>
          }
          onClick={onPlayClick}
        />
      );
    }

    return (
      <>
        <HStack position="relative" height={6} width="100%" justify="center">
          {/* If not selected, overlay playlist number on top of play/pause button */}
          {!isSelected && (
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              bg="gray.800"
              zIndex={1}
              _hover={{ opacity: 0 }}
              transition="opacity 0.05s"
            >
              <Button variant="unstyled" onClick={onPlayClick} fontSize={14}>
                {index + 1}
              </Button>
            </Box>
          )}
          {playPauseButton}
        </HStack>
      </>
    );
  },
);
