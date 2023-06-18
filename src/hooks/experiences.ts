import { useStore } from "@/src/types/StoreContext";
import { useEffect, useState } from "react";

export function useExperiences(
  shouldLoadExperiences: boolean,
  forLoggedInUserOnly = true
) {
  const { user, initialized, experienceStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState<string[]>([]);

  useEffect(() => {
    if (
      !initialized ||
      !shouldLoadExperiences ||
      (forLoggedInUserOnly && !user)
    )
      return;

    const fetchExperiences = async () => {
      setLoading(true);

      const experienceFilenames =
        await experienceStore.fetchAvailableExperiences(
          forLoggedInUserOnly ? user : ""
        );

      setExperiences(experienceFilenames);
      setLoading(false);
    };

    fetchExperiences();
  }, [
    initialized,
    user,
    experienceStore,
    shouldLoadExperiences,
    forLoggedInUserOnly,
  ]);

  return { loading, experiences };
}
