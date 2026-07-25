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
import { queryParamToPlaylistId } from "@/src/types/Playlist";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export const PlaylistLibrary = observer(function PlaylistLibrary() {
  const store = useStore();
  const { userStore, usingLocalData, playlistStore } = store;
  const { username } = userStore;
  const router = useRouter();

  const [viewingAllPlaylists, setViewingAllPlaylists] = useState(true);

  const isEditable = userStore.isAuthenticated;

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
    {
      enabled: userStore.isAuthenticated,
      staleTime: 1000 * 60 * 10,
    },
  );

  // Restore selection from `?playlist=` (initial load + back/forward).
  // Falls back to the first playlist when the param is missing or unknown.
  useEffect(() => {
    if (!playlists?.length || !router.isReady) return;

    const param =
      typeof router.query.playlist === "string" ? router.query.playlist : null;
    const playlistId = param ? queryParamToPlaylistId(param) : null;
    const fromUrl =
      playlistId != null
        ? playlists.find((playlist) => playlist.id === playlistId)
        : undefined;

    if (fromUrl) {
      if (playlistStore.selectedPlaylist?.id === fromUrl.id) return;
      runInAction(() => {
        playlistStore.selectedPlaylist = fromUrl;
      });
      return;
    }

    if (!playlistStore.selectedPlaylist) {
      runInAction(() => {
        playlistStore.selectedPlaylist = playlists[0];
      });
    }
  }, [
    playlists,
    playlistStore,
    router.isReady,
    router.query.playlist,
  ]);

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
          playlists?.map((playlist) => (
            <SelectablePlaylist key={playlist.id} playlist={playlist} />
          ))
        )}
      </VStack>
    </VStack>
  );
});
