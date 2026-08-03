import { useEffect } from "react";
import { useStore } from "@/src/types/StoreContext";
import { addAutosave } from "@/src/utils/autosavePersistence";
import { runInAction } from "mobx";

export const AUTOSAVE_INTERVAL_MS = 2 * 60 * 1000;

/**
 * Periodically snapshots the open experience to IndexedDB when it has changed
 * since the last autosave/load. Experience-editor only.
 */
export const useExperienceAutosave = () => {
  const store = useStore();

  useEffect(() => {
    if (store.context !== "experienceEditor") return;
    if (typeof window === "undefined") return;

    const maybeAutosave = async () => {
      if (store.initializationState !== "initialized") return;
      if (store.experienceStore.loadingExperienceName) return;
      if (!store.experienceName) return;
      if (!store.experienceStore.isDirtyRelativeToAutosaveSnapshot()) return;

      const experienceKey = store.experienceStore.autosaveExperienceKey;
      const snapshot = store.experienceStore.getAutosaveSnapshot();

      try {
        await addAutosave(experienceKey, snapshot);
        runInAction(() => {
          store.experienceStore.lastAutosaveSnapshot = snapshot;
        });
      } catch (error) {
        console.error("Failed to autosave experience", error);
      }
    };

    const intervalId = window.setInterval(maybeAutosave, AUTOSAVE_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [store]);
};
