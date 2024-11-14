import { HStack, IconButton, Text, VStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { FaTrashAlt } from "react-icons/fa";
import { action, runInAction } from "mobx";
import { trpc } from "@/src/utils/trpc";
import { Playlist } from "@/src/types/Playlist";
import { HiSparkles } from "react-icons/hi";

export const SelectablePlaylist = observer(function SelectablePlaylist({
  playlist,
}: {
  playlist: Playlist;
}) {
  const store = useStore();
  const { username, usingLocalData, playlistStore } = store;

  const isEditable = store.username === playlist.user.username;

  const isSelected = playlistStore.selectedPlaylist?.id === playlist.id;

  const utils = trpc.useUtils();
  const deletePlaylist = trpc.playlist.deletePlaylist.useMutation();

  return (
    <HStack
      px={6}
      py={2}
      width="100%"
      justify="space-between"
      align="center"
      role="button"
      onClick={action(() => (playlistStore.selectedPlaylist = playlist))}
      bgColor={isSelected ? "gray.600" : undefined}
      _hover={{
        bgColor: isSelected ? "gray.500" : "gray.600",
        transition: "background-color 0.2s",
      }}
    >
      <VStack
        width="100%"
        height="100%"
        justify="start"
        alignItems="start"
        spacing={0}
      >
        <HStack spacing={1} justify="start">
          {playlist.user.username === "conjurer" && <HiSparkles />}
          <Text fontSize="md" fontWeight="bold">
            {playlist.name}
          </Text>
        </HStack>

        <HStack spacing={4} justify="space-between">
          <Text fontSize="sm" color="gray.400">
            {playlist.user.username} • {playlist.orderedExperienceIds.length}{" "}
            experiences
          </Text>
        </HStack>
      </VStack>

      {isEditable && (
        <IconButton
          aria-label="Delete playlist"
          variant="ghost"
          size="sm"
          icon={<FaTrashAlt size={12} />}
          onClick={action(async () => {
            if (
              !confirm(
                "Are you sure you want to delete this playlist? This will permanently cast the playlist into the fires of Mount Doom.",
              )
            )
              return;

            await deletePlaylist.mutateAsync({
              username,
              usingLocalData,
              id: playlist.id,
            });
            utils.playlist.listPlaylists.invalidate();

            if (playlistStore.selectedPlaylist?.id === playlist.id) {
              runInAction(() => {
                playlistStore.selectedPlaylist = null;
              });
            }
          })}
        />
      )}
    </HStack>
  );
});
