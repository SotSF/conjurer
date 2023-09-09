import { useStore } from "@/src/types/StoreContext";
import { useEffect, useState } from "react";

export function useExperiences(
  shouldLoadExperiences: boolean,
  forLoggedInUserOnly = true
) {
  const { user, initializedClientSide, experienceStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState<string[]>([]);

  useEffect(() => {
    if (
      !initializedClientSide ||
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
    initializedClientSide,
    user,
    experienceStore,
    shouldLoadExperiences,
    forLoggedInUserOnly,
  ]);

  return { loading, experiences };
}
