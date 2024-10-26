import { useStore } from "@/src/types/StoreContext";
import { trpc } from "@/src/utils/trpc";
import { useToast } from "@chakra-ui/react";
import { runInAction } from "mobx";

export const useSaveExperience = () => {
  const store = useStore();
  const { usingLocalData } = store;
  const saveExperienceMutation = trpc.experience.saveExperience.useMutation();

  const utils = trpc.useUtils();
  const toast = useToast();

  const saveExperience = async (saveMetadata?: {
    id?: number;
    name: string;
  }) => {
    const savePayload = {
      usingLocalData,
      ...store.serialize(),
      username: store.user,
    };
    if (saveMetadata) {
      savePayload.id = saveMetadata.id;
      savePayload.name = saveMetadata.name;
    }

    let savedId;
    try {
      savedId = await saveExperienceMutation.mutateAsync(savePayload);
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

    runInAction(() => {
      store.hasSaved = true;
      store.experienceLastSavedAt = Date.now();
      store.experienceId = savedId;
      store.experienceName = savePayload.name;
    });

    toast({
      title: "Experience saved",
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    utils.experience.listExperiences.invalidate({ username: store.user });
  };

  return { saveExperience };
};
