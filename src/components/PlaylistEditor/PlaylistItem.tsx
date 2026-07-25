import { Box, HStack, IconButton, Td, Text, Tr, VStack } from "@chakra-ui/react";
import { action } from "mobx";
import { FaPencilAlt } from "react-icons/fa";
import { useState } from "react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { ImCross } from "react-icons/im";
import { Experience } from "@/src/types/Experience";
import { useSavePlaylist } from "@/src/hooks/playlist";
import { Playlist } from "@/src/types/Playlist";
import { ExperienceThumbnail } from "@/src/components/ExperienceThumbnail";
import { ExperienceStatusIndicator } from "../ExperienceStatusIndicator";
import { PlaylistItemPlayPauseButton } from "@/src/components/PlaylistEditor/PlaylistItemPlayPauseButton";
import { Draggable } from "@hello-pangea/dnd";
import { MdDragIndicator } from "react-icons/md";

type PlaylistItemControlsProps = {
  playlist: Playlist;
  experience: Experience;
  user: { username: string };
  index: number;
  editable?: boolean;
};

export const PlaylistItem = observer(function PlaylistItem({
  playlist,
  experience,
  user,
  index,
  editable,
}: PlaylistItemControlsProps) {
  const store = useStore();
  const { experienceStore, playlistStore } = store;

  const router = useRouter();

  const { savePlaylist } = useSavePlaylist();

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
    <Draggable
      draggableId={String(experience.id)}
      index={index}
      isDragDisabled={!editable}
    >
      {(provided, snapshot) => (
        <Tr
          ref={provided.innerRef}
          {...provided.draggableProps}
          bg={snapshot.isDragging ? "gray.700" : undefined}
        >
          <Td>
            <HStack height={4} spacing={1} justify="end">
              {editable && (
                <Box
                  {...provided.dragHandleProps}
                  cursor="grab"
                  color="gray.400"
                  _hover={{ color: "blue.400" }}
                  display="flex"
                  alignItems="center"
                  aria-label="Drag to reorder"
                  title="Drag to reorder"
                >
                  <MdDragIndicator size={18} />
                </Box>
              )}
              <PlaylistItemPlayPauseButton
                index={index}
                isSelected={isSelectedExperience}
                loadingExperience={loadingExperience}
                onPlayClick={onPlayClick}
                onPauseClick={onPauseClick}
              />
            </HStack>
          </Td>

          <Td>
            <HStack>
              <ExperienceThumbnail
                thumbnailURL={experience.thumbnailURL}
                onClick={onSelect}
              />
              <VStack {...textProps} alignItems="start">
                <Text fontWeight="bold">{experience.name}</Text>
                <Text>{user.username}</Text>
              </VStack>
            </HStack>
          </Td>

          <Td>
            <HStack {...textProps} justify="center">
              <ExperienceStatusIndicator experienceStatus={experience.status} />
            </HStack>
          </Td>

          <Td>
            <Text {...textProps}>{experience.song.artist}</Text>
          </Td>

          <Td>
            <Text {...textProps}>{experience.song.name}</Text>
          </Td>

          <Td px={0}>
            <HStack height={10} alignItems="center" spacing={0}>
              <IconButton
                variant="link"
                aria-label="Edit experience"
                title="Edit experience"
                height={6}
                _hover={{ color: "orange.500" }}
                icon={<FaPencilAlt size={10} />}
                onClick={action(() => {
                  store.role = "experienceCreator";
                  experienceStore.openExperience(router, experience.name);
                })}
              />
              {editable && (
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
                        (id) => id !== experience.id,
                      ),
                    });
                  }}
                />
              )}
            </HStack>
          </Td>
        </Tr>
      )}
    </Draggable>
  );
});
