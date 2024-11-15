import { useStore } from "@/src/types/StoreContext";
import { trpc } from "@/src/utils/trpc";
import { useToast } from "@chakra-ui/react";
import { runInAction } from "mobx";

export const useSaveExperience = () => {
  const store = useStore();
  const { userStore, usingLocalData } = store;
  const { username } = userStore;
  const saveExperienceMutation = trpc.experience.saveExperience.useMutation();

  const utils = trpc.useUtils();
  const toast = useToast();

  const saveExperience = async (saveMetadata?: {
    id?: number;
    name: string;
  }) => {
    if ((saveMetadata?.name ?? store.experienceName) === "untitled") {
      runInAction(() => {
        store.uiStore.showingSaveExperienceModal = true;
      });
      return;
    }

    const savePayload = {
      usingLocalData,
      ...store.serialize(),
      username,
    };
    if (saveMetadata) {
      savePayload.id = saveMetadata.id;
      savePayload.name = saveMetadata.name;
    }

    let savedId: number;
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
      return;
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

    utils.experience.listExperiencesForUser.invalidate();
    utils.experience.listExperiences.invalidate();
  };

  return { saveExperience };
};
