import { useStore } from "@/src/types/StoreContext";
import { trpc } from "@/src/utils/trpc";

export const useExperiences = ({
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
    data: experiences,
  } = trpc.experience.listExperiences.useQuery(
    {
      username,
      usingLocalData,
    },
    { enabled },
  );

  const sortedExperiences = (experiences ?? []).sort((a, b) =>
    `${a.user.username}${a.name}`.localeCompare(`${b.user.username}${b.name}`),
  );

  return {
    isPending,
    isError,
    isRefetching,
    experiences: sortedExperiences,
  };
};
