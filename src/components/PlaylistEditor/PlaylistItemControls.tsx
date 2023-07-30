import { Button, HStack, IconButton, Td, Text, VStack } from "@chakra-ui/react";
import { RxCaretDown, RxCaretUp } from "react-icons/rx";
import { action } from "mobx";
import { FaPause, FaPlay, FaTrashAlt } from "react-icons/fa";
import { memo, useState } from "react";
import { useStore } from "@/src/types/StoreContext";

type PlaylistItemControlsProps = {
  experienceFilename: string;
  index: number;
  playlistLength: number;
};

export const PlaylistItemControls = memo(function PlaylistItemControls({
  experienceFilename,
  index,
  playlistLength,
}: PlaylistItemControlsProps) {
  const store = useStore();
  const { playlistStore } = store;

  const [mousingOver, setMousingOver] = useState(false);
  const [loadingExperience, setLoadingExperience] = useState(false);
  const onPlayClick = async () => {
    setLoadingExperience(true);
    await playlistStore.playExperience(experienceFilename);
    setLoadingExperience(false);
  };

  const isSelectedExperience = store.experienceFilename === experienceFilename;

  return (
    <>
      <HStack
        height={16}
        justify="center"
        onMouseEnter={() => setMousingOver(true)}
        onMouseLeave={() => setMousingOver(false)}
      >
        {mousingOver ? (
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
      <Td>
        <Text fontSize={14}>{experienceFilename}</Text>
      </Td>
      <HStack height={16} alignItems="center" spacing={0}>
        <VStack spacing={0}>
          {index > 0 && (
            <IconButton
              variant="link"
              aria-label="Move up"
              title="Move up"
              height={4}
              _hover={{ color: "blue.500" }}
              icon={<RxCaretUp size={28} />}
              onClick={action(() => {})}
            />
          )}
          {index < playlistLength - 1 && (
            <IconButton
              variant="link"
              aria-label="Move down"
              title="Move down"
              height={4}
              _hover={{ color: "blue.500" }}
              icon={<RxCaretDown size={28} />}
              onClick={action(() => {})}
            />
          )}
        </VStack>
        <IconButton
          variant="link"
          aria-label="Delete effect"
          title="Delete effect"
          height={6}
          _hover={{ color: "red.500" }}
          icon={<FaTrashAlt size={12} />}
          onClick={action(() => {})}
        />
      </HStack>
    </>
  );
});
