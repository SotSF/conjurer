import {
  Button,
  HStack,
  Spinner,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { FaPlus } from "react-icons/fa";
import { runInAction } from "mobx";
import { trpc } from "@/src/utils/trpc";
import { SelectablePlaylist } from "@/src/components/PlaylistEditor/SelectablePlaylist";
import { useEffect, useState } from "react";

export const PlaylistLibrary = observer(function PlaylistLibrary() {
  const store = useStore();
  const { username, usingLocalData, playlistStore } = store;

  const [viewingAllPlaylists, setViewingAllPlaylists] = useState(false);

  const isEditable = !!store.username;

  const utils = trpc.useUtils();
  const createPlaylist = trpc.playlist.savePlaylist.useMutation();

  const {
    isPending,
    isError,
    data: playlists,
  } = trpc.playlist.listPlaylists.useQuery(
    {
      usingLocalData,
      username,
      allPlaylists: viewingAllPlaylists,
    },
    { staleTime: 1000 * 60 * 10 }
  );

  useEffect(() => {
    if (!playlists || playlists.length === 0 || playlistStore.selectedPlaylist)
      return;
    runInAction(() => {
      playlistStore.selectedPlaylist = playlists[0];
    });
  }, [playlists]);

  if (isError) return null;

  return (
    <VStack
      width="100%"
      height="100%"
      justify="start"
      alignItems="start"
      bgColor="gray.800"
      borderStyle="solid"
      borderRightWidth={1}
      py={4}
      spacing={1}
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
            onClick={async () => {
              const newPlaylist = await createPlaylist.mutateAsync({
                username,
                usingLocalData,
                name: "New Playlist",
                description: "",
                orderedExperienceIds: [],
              });
              runInAction(() => {
                playlistStore.selectedPlaylist = newPlaylist;
              });
              utils.playlist.listPlaylists.invalidate();
            }}
          >
            Playlist
          </Button>
        )}
      </HStack>

      <VStack width="100%" height={2}></VStack>

      <Switch
        my={2}
        mx={6}
        size="sm"
        isChecked={viewingAllPlaylists}
        onChange={(e) => setViewingAllPlaylists(e.target.checked)}
      >
        All playlists
      </Switch>
      <VStack width="100%" spacing={0}>
        {isPending ? (
          <Spinner />
        ) : (
          playlists.map((playlist) => (
            <SelectablePlaylist key={playlist.id} playlist={playlist} />
          ))
        )}
      </VStack>
    </VStack>
  );
});
