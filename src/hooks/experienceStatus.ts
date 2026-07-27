import { useStore } from "@/src/types/StoreContext";
import {
  EXPERIENCE_STATUSES,
  type ExperienceStatus,
} from "@/src/types/Experience";
import { trpc } from "@/src/utils/trpc";
import { useToast } from "@chakra-ui/react";
import { runInAction } from "mobx";

export function getNextExperienceStatus(
  status: ExperienceStatus,
): ExperienceStatus {
  return status === "complete" ? "inprogress" : "complete";
}

export function getExperienceStatusLabel(status: ExperienceStatus) {
  return status === "complete" ? "Complete" : "In Progress";
}

export const useUpdateExperienceStatus = () => {
  const store = useStore();
  const { userStore, usingLocalData } = store;
  const updateExperienceStatusMutation =
    trpc.experience.updateExperienceStatus.useMutation();
  const utils = trpc.useUtils();
  const toast = useToast();

  const updateExperienceStatus = async (
    experienceId: number,
    status: ExperienceStatus,
  ) => {
    if (!EXPERIENCE_STATUSES.includes(status)) return;

    try {
      await updateExperienceStatusMutation.mutateAsync({
        usingLocalData,
        username: userStore.username,
        experienceId,
        status,
      });

      if (store.experienceId === experienceId) {
        runInAction(() => {
          store.experienceStatus = status;
        });
      }

      await Promise.all([
        utils.experience.listExperiences.invalidate(),
        utils.experience.listExperiencesForUser.invalidate(),
        utils.playlist.getPlaylist.invalidate(),
      ]);

      toast({
        title: `Marked as ${getExperienceStatusLabel(status).toLowerCase()}`,
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (e: unknown) {
      toast({
        title: "Failed to update experience status",
        description: e instanceof Error ? e.message : undefined,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const toggleExperienceStatus = async (
    experienceId: number,
    currentStatus: ExperienceStatus,
  ) => {
    await updateExperienceStatus(
      experienceId,
      getNextExperienceStatus(currentStatus),
    );
  };

  return {
    updateExperienceStatus,
    toggleExperienceStatus,
    isPending: updateExperienceStatusMutation.isPending,
  };
};
