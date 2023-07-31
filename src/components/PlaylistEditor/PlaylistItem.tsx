import {
  Button,
  HStack,
  IconButton,
  Spinner,
  Td,
  Text,
  VStack,
} from "@chakra-ui/react";
import { RxCaretDown, RxCaretUp } from "react-icons/rx";
import { action } from "mobx";
import { FaPause, FaPlay, FaTrashAlt } from "react-icons/fa";
import { useState } from "react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import {
  extractExperienceNameFromFileName,
  extractUserFromFilename,
} from "@/src/types/ExperienceStore";

type PlaylistItemControlsProps = {
  experienceFilename: string;
  index: number;
  playlistLength: number;
};

export const PlaylistItem = observer(function PlaylistItem({
  experienceFilename,
  index,
  playlistLength,
}: PlaylistItemControlsProps) {
  const store = useStore();
  const { playlistStore, timer } = store;

  const [mousingOver, setMousingOver] = useState(false);
  const [loadingExperience, setLoadingExperience] = useState(false);
  const onPlayClick = async () => {
    setLoadingExperience(true);
    await playlistStore.loadAndPlayExperience(experienceFilename);
    setLoadingExperience(false);
  };
  const onPauseClick = () => {
    if (timer.playing) timer.togglePlaying();
  };
  const onSelect = async () => {
    setLoadingExperience(true);
    await playlistStore.loadExperience(experienceFilename);
    setLoadingExperience(false);
  };

  const isSelectedExperience = store.experienceFilename === experienceFilename;

  const textProps = {
    color: isSelectedExperience ? "blue.400" : undefined,
    fontSize: 14,
    cursor: "pointer",
    _hover: { textDecoration: "underline" },
    onClick: onSelect,
  };

  return (
    <>
      <Td>
        <HStack
          height={4}
          justify="center"
          onMouseEnter={() => setMousingOver(true)}
          onMouseLeave={() => setMousingOver(false)}
        >
          {isSelectedExperience && loadingExperience ? (
            <Spinner />
          ) : isSelectedExperience ? (
            <IconButton
              variant="unstyled"
              aria-label="Play"
              title="Play"
              color={timer.playing ? "orange" : "green"}
              height={6}
              icon={
                <HStack justify="center">
                  {timer.playing ? <FaPause size={10} /> : <FaPlay size={10} />}
                </HStack>
              }
              onClick={timer.playing ? onPauseClick : onPlayClick}
            />
          ) : mousingOver ? (
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
          ) : (
            <Button variant="unstyled" onClick={onPlayClick} fontSize={14}>
              {index + 1}
            </Button>
          )}
        </HStack>
      </Td>

      <Td>
        <Text {...textProps}>
          {extractUserFromFilename(experienceFilename)}
        </Text>
      </Td>

      <Td>
        <Text {...textProps}>
          {extractExperienceNameFromFileName(experienceFilename)}
        </Text>
      </Td>

      <Td px={0}>
        <HStack height={10} alignItems="center" spacing={0}>
          <VStack spacing={0}>
            {index > 0 && (
              <IconButton
                variant="link"
                aria-label="Move up"
                title="Move up"
                height={4}
                _hover={{ color: "blue.500" }}
                icon={<RxCaretUp size={20} />}
                onClick={action(() =>
                  playlistStore.reorderExperience(index, -1)
                )}
              />
            )}
            {index < playlistLength - 1 && (
              <IconButton
                variant="link"
                aria-label="Move down"
                title="Move down"
                height={4}
                _hover={{ color: "blue.500" }}
                icon={<RxCaretDown size={20} />}
                onClick={action(() =>
                  playlistStore.reorderExperience(index, 1)
                )}
              />
            )}
          </VStack>
          <IconButton
            variant="link"
            aria-label="Delete effect"
            title="Delete effect"
            height={6}
            _hover={{ color: "red.500" }}
            icon={<FaTrashAlt size={10} />}
            onClick={action(() => playlistStore.removeExperience(index))}
          />
        </HStack>
      </Td>
    </>
  );
});
