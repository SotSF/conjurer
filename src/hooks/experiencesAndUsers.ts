import { useStore } from "@/src/types/StoreContext";
import { trpc } from "@/src/utils/trpc";

export const useExperiencesAndUsers = ({
  username,
  enabled,
}: {
  username: string | undefined;
  enabled: boolean;
}) => {
  const store = useStore();
  const { usingLocalData } = store;

  const {
    isPending,
    isError,
    isRefetching,
    data: experiencesAndUsers,
  } = trpc.experience.listExperiencesAndUsers.useQuery(
    {
      username,
      usingLocalData,
    },
    { enabled }
  );

  const sortedExperiencesAndUsers = (experiencesAndUsers ?? []).sort((a, b) =>
    `${a.user.username}${a.experience.name}`.localeCompare(
      `${b.user.username}${b.experience.name}`
    )
  );

  return {
    isPending,
    isError,
    isRefetching,
    experiencesAndUsers: sortedExperiencesAndUsers,
  };
};
