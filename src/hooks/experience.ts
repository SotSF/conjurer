import { useStore } from "@/src/types/StoreContext";
import { trpc } from "@/src/utils/trpc";
import { runInAction } from "mobx";

export const useSaveExperience = () => {
  const store = useStore();
  const { usingLocalData } = store;
  const saveExperienceMutation = trpc.experience.saveExperience.useMutation();

  const utils = trpc.useUtils();

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
    // Error handling is left to the consumer of `saveExperience`
    const savedId = await saveExperienceMutation.mutateAsync(savePayload);

    runInAction(() => {
      store.hasSaved = true;
      store.experienceLastSavedAt = Date.now();
      store.experienceId = savedId;
      store.experienceName = savePayload.name;
    });

    utils.experience.listExperiences.invalidate({ username: store.user });
  };

  return { saveExperience };
};
