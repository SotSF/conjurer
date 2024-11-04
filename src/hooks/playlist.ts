import { Playlist } from "@/src/types/Playlist";
import { useStore } from "@/src/types/StoreContext";
import { trpc } from "@/src/utils/trpc";
import { useToast } from "@chakra-ui/react";

export const useSavePlaylist = () => {
  const store = useStore();
  const { username, usingLocalData } = store;
  const savePlaylistMutation = trpc.playlist.savePlaylist.useMutation();

  const utils = trpc.useUtils();
  const toast = useToast();

  const savePlaylist = async (saveMetadata: {
    id?: number;
    name: string;
    description: string;
    orderedExperienceIds: number[];
  }) => {
    const savePayload = {
      username,
      usingLocalData,
      ...saveMetadata,
    };

    let savedPlaylist;
    try {
      savedPlaylist = await savePlaylistMutation.mutateAsync(savePayload);
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Failed to save experience",
        description: e && e.message,
        status: "error",
        duration: 15_000,
        isClosable: true,
      });
      throw e;
    }

    await Promise.all([
      utils.playlist.listPlaylistsForUser.invalidate(),
      utils.playlist.getPlaylist.invalidate({
        usingLocalData,
        id: savedPlaylist.id,
      }),
    ]);

    return savedPlaylist;
  };

  return { savePlaylist };
};
