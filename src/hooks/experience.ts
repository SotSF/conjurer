import { useStore } from "@/src/types/StoreContext";
import { trpc } from "@/src/utils/trpc";
import { action } from "mobx";

export const useSaveExperience = () => {
  const store = useStore();
  const { usingLocalData } = store;
  const saveExperienceMutation = trpc.experience.saveExperience.useMutation();

  const utils = trpc.useUtils();

  const saveExperience = action(async () => {
    store.hasSaved = true;
    store.experienceLastSavedAt = Date.now();
    saveExperienceMutation.mutate(
      {
        usingLocalData,
        ...store.serialize(),
        username: store.user,
      },
      {
        onSuccess: (id) => {
          utils.experience.listExperiences.invalidate({ username: store.user });
          store.experienceId = id;
        },
      }
    );
  });

  return { saveExperience };
};
