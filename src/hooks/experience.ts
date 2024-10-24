import { useStore } from "@/src/types/StoreContext";
import { trpc } from "@/src/utils/trpc";
import { action } from "mobx";

export const useSaveExperience = () => {
  const store = useStore();
  const { experienceStore, user, experienceName, usingLocalData } = store;
  const saveExperienceMutation = trpc.experience.saveExperience.useMutation();

  const utils = trpc.useUtils();

  const saveExperience = action(async () => {
    store.hasSaved = true;
    store.experienceLastSavedAt = Date.now();
    saveExperienceMutation.mutate({
      usingLocalData,
      username: user,
      filename: experienceName,
      experience: experienceStore.stringifyExperience(),
    });
    utils.experience.invalidate();
  });

  return { saveExperience };
};
