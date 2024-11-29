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

    let playPauseButton = null;
    // If loading experience, show spinner
    if (loadingExperience) playPauseButton = <Spinner />;
    // If experience is selected, show play/pause button
    else if (isSelected) {
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
      // If experience is not selected, show play button
    } else {
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
        <Box position="relative" height={6}>
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
        </Box>
      </>
    );
  },
);
