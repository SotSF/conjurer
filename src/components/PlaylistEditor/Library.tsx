import { Button, HStack, Text, VStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { FaPlus } from "react-icons/fa";
import { action } from "mobx";
import { trpc } from "@/src/utils/trpc";
import { SelectablePlaylist } from "@/src/components/PlaylistEditor/SelectablePlaylist";
import { useEffect } from "react";

export const Library = observer(function Library() {
  const store = useStore();
  const { username, usingLocalData, playlistStore } = store;

  const isEditable = !!store.username;

  const utils = trpc.useUtils();
  const createPlaylist = trpc.playlist.savePlaylist.useMutation();

  const {
    isPending,
    isError,
    data: playlists,
  } = trpc.playlist.listPlaylistsForUser.useQuery({
    usingLocalData,
    username,
  });

  useEffect(() => {
    if (
      !playlists ||
      playlists.length === 0 ||
      playlistStore.selectedPlaylistId
    )
      return;
    playlistStore.selectedPlaylistId = playlists[0].id;
  }, [playlists]);

  if (isPending || isError) return null;

  return (
    <VStack
      width="100%"
      height="100%"
      justify="start"
      alignItems="start"
      bgColor="gray.800"
      borderStyle="solid"
      borderRightWidth={1}
      spacing={2}
      py={4}
    >
      <HStack px={4} width="100%" justify="space-between" align="center">
        <Text fontSize="2xl" fontWeight="bold">
          Conjurer
        </Text>
        {isEditable && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FaPlus size={14} />}
            onClick={action(async () => {
              const newPlaylistId = await createPlaylist.mutateAsync({
                username,
                usingLocalData,
                name: "New Playlist",
                description: "New Playlist",
                orderedExperienceIds: [],
              });
              playlistStore.selectedPlaylistId = newPlaylistId;
              utils.playlist.listPlaylistsForUser.invalidate();
            })}
          >
            Playlist
          </Button>
        )}
      </HStack>

      <VStack width="100%" spacing={0}>
        {playlists.map((playlist) => (
          <SelectablePlaylist key={playlist.id} playlist={playlist} />
        ))}
      </VStack>
    </VStack>
  );
});
