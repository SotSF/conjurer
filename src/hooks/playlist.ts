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

    let savedId: number;
    try {
      savedId = await savePlaylistMutation.mutateAsync(savePayload);
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

    utils.playlist.listPlaylistsForUser.invalidate();
    utils.playlist.getPlaylist.invalidate({ id: savedId });

    return savedId;
  };

  return { savePlaylist };
};
