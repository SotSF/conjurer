import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { trpc } from "@/src/utils/trpc";
import { useEffect } from "react";
import { runInAction } from "mobx";
import { extractPartsFromExperienceFilename } from "@/src/utils/experience";

export const ExperienceLoader = observer(function ExperienceLoader() {
  const store = useStore();
  const { experienceStore, usingLocalAssets } = store;

  const { data } = trpc.experience.loadExperience.useQuery(
    {
      experienceFilename: experienceStore.experienceToLoad,
      usingLocalAssets,
    },
    { enabled: !!experienceStore.experienceToLoad }
  );
  const experienceString = data?.experience;

  useEffect(() => {
    if (!experienceString) return;

    runInAction(() => {
      const { user, experienceName } = extractPartsFromExperienceFilename(
        experienceStore.experienceToLoad
      );
      store.user = user;
      store.experienceName = experienceName;
      store.experienceLastSavedAt = Date.now();
      experienceStore.loadFromString(experienceString);
      experienceStore.experienceToLoad = "";
    });
  }, [experienceString, experienceStore, store]);

  return null;
});
