import { useStore } from "@/src/types/StoreContext";
import { trpc } from "@/src/utils/trpc";
import { action } from "mobx";

export const useSaveExperience = () => {
  const store = useStore();
  const { experienceStore, user, experienceName, usingLocalAssets } = store;
  const saveExperienceMutation = trpc.experience.saveExperience.useMutation();

  const utils = trpc.useUtils();

  const saveExperience = action(async () => {
    store.experienceLastSavedAt = Date.now();
    const filename = `${user}-${experienceName || "untitled"}`;
    saveExperienceMutation.mutate({
      usingLocalAssets,
      experience: experienceStore.stringifyExperience(),
      filename,
    });
    // TODO: make this actually work...
    utils.invalidate(undefined);
    // utils.invalidate(undefined, { queryKey: ["experience"] });
  });

  return { saveExperience };
};
