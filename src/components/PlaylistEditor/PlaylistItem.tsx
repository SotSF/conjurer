import {
  Box,
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
import { FaPause, FaPencilAlt, FaPlay } from "react-icons/fa";
import { useState } from "react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { ImCross } from "react-icons/im";
import { Experience } from "@/src/types/Experience";
import { useSavePlaylist } from "@/src/hooks/playlist";
import { Playlist } from "@/src/types/Playlist";
import { reorder } from "@/src/utils/array";

type PlaylistItemControlsProps = {
  playlist: Playlist;
  experience: Experience;
  user: { username: string };
  index: number;
  playlistLength: number;
  editable?: boolean;
};

export const PlaylistItem = observer(function PlaylistItem({
  playlist,
  experience,
  user,
  index,
  playlistLength,
  editable,
}: PlaylistItemControlsProps) {
  const store = useStore();
  const { experienceStore, playlistStore } = store;

  const router = useRouter();

  const { savePlaylist } = useSavePlaylist();

  const [mousingOver, setMousingOver] = useState(false);
  const [loadingExperience, setLoadingExperience] = useState(false);
  const onPlayClick = async () => {
    if (loadingExperience || !experience.id) return;
    setLoadingExperience(true);
    await playlistStore.loadAndPlayExperience(experience.id);
    setLoadingExperience(false);
  };
  const onPauseClick = () => {
    if (loadingExperience) return;
    store.pause();
  };
  const onSelect = async () => {
    if (loadingExperience) return;
    setLoadingExperience(true);
    await experienceStore.load(experience.name);
    setLoadingExperience(false);
  };

  const isSelectedExperience = store.experienceName === experience.name;

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
        <HStack height={4} spacing={0} justify="end">
          {editable && (
            <>
              <VStack spacing={0}>
                {index > 0 && (
                  <IconButton
                    variant="link"
                    aria-label="Move up"
                    title="Move up"
                    height={4}
                    _hover={{ color: "blue.500" }}
                    icon={<RxCaretUp size={20} />}
                    onClick={() =>
                      savePlaylist({
                        ...playlist,
                        orderedExperienceIds: reorder(
                          playlist.orderedExperienceIds,
                          index,
                          index - 1
                        ),
                      })
                    }
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
                    onClick={() =>
                      savePlaylist({
                        ...playlist,
                        orderedExperienceIds: reorder(
                          playlist.orderedExperienceIds,
                          index,
                          index + 1
                        ),
                      })
                    }
                  />
                )}
              </VStack>
            </>
          )}
          <Box
            m={0}
            onPointerEnter={() => setMousingOver(true)}
            onPointerLeave={() => setMousingOver(false)}
          >
            {isSelectedExperience && loadingExperience ? (
              <Spinner />
            ) : isSelectedExperience ? (
              <IconButton
                variant="unstyled"
                aria-label="Play"
                title="Play"
                color={store.playing ? "orange" : "green"}
                height={6}
                icon={
                  <HStack justify="center">
                    {store.playing ? (
                      <FaPause size={10} />
                    ) : (
                      <FaPlay size={10} />
                    )}
                  </HStack>
                }
                onClick={store.playing ? onPauseClick : onPlayClick}
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
          </Box>
        </HStack>
      </Td>

      <Td>
        <Text {...textProps} fontWeight="bold">
          {experience.name}
        </Text>
      </Td>

      <Td>
        <Text {...textProps}>{user.username}</Text>
      </Td>

      <Td>
        <Text {...textProps}>
          {experience.song.artist} - {experience.song.name}
        </Text>
      </Td>

      <Td px={0}>
        <HStack height={10} alignItems="center" spacing={0}>
          {store.username === user.username && (
            <>
              <IconButton
                variant="link"
                aria-label="Edit experience"
                title="Edit experience"
                height={6}
                _hover={{ color: "orange.500" }}
                icon={<FaPencilAlt size={10} />}
                onClick={action(() =>
                  router.push(`/experience/${experience.name}`)
                )}
              />
            </>
          )}
          {editable && (
            <>
              <IconButton
                variant="link"
                aria-label="Remove experience from playlist"
                title="Remove experience from playlist"
                height={6}
                _hover={{ color: "red.500" }}
                icon={<ImCross size={10} />}
                onClick={() => {
                  savePlaylist({
                    ...playlist,
                    orderedExperienceIds: playlist.orderedExperienceIds.filter(
                      (id) => id !== experience.id
                    ),
                  });
                }}
              />
            </>
          )}
        </HStack>
      </Td>
    </>
  );
});
