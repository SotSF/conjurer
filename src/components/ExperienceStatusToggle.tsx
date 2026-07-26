import { observer } from "mobx-react-lite";
import { Button, HStack, Text } from "@chakra-ui/react";
import { ExperienceStatusIndicator } from "@/src/components/ExperienceStatusIndicator";
import {
  getExperienceStatusLabel,
  getNextExperienceStatus,
  useUpdateExperienceStatus,
} from "@/src/hooks/experienceStatus";
import type { ExperienceStatus } from "@/src/types/Experience";
import { useStore } from "@/src/types/StoreContext";
import { canUpdateExperienceStatus } from "@/src/utils/experiencePermissions";

type ExperienceStatusToggleProps = {
  experienceId: number | undefined;
  experienceUserId: number;
  status: ExperienceStatus;
  withLabel?: boolean;
};

export const ExperienceStatusToggle = observer(function ExperienceStatusToggle({
  experienceId,
  experienceUserId,
  status,
  withLabel,
}: ExperienceStatusToggleProps) {
  const store = useStore();
  const { userStore } = store;
  const { toggleExperienceStatus, isPending } = useUpdateExperienceStatus();

  const canEdit =
    experienceId != null &&
    canUpdateExperienceStatus(userStore.me, experienceUserId);

  if (!canEdit) {
    return (
      <ExperienceStatusIndicator experienceStatus={status} withLabel={withLabel} />
    );
  }

  const nextStatus = getNextExperienceStatus(status);

  return (
    <Button
      variant="ghost"
      size="xs"
      px={withLabel ? 2 : 1}
      py={0}
      height="auto"
      minH={6}
      isLoading={isPending}
      title={`Mark as ${getExperienceStatusLabel(nextStatus).toLowerCase()}`}
      aria-label={`Mark as ${getExperienceStatusLabel(nextStatus).toLowerCase()}`}
      onClick={(event) => {
        event.stopPropagation();
        void toggleExperienceStatus(experienceId, status);
      }}
    >
      <HStack spacing={1}>
        <ExperienceStatusIndicator experienceStatus={status} withLabel={withLabel} />
        {userStore.me?.isAdmin &&
          experienceUserId !== userStore.me.id &&
          withLabel && (
            <Text fontSize="xs" color="gray.400">
              (admin)
            </Text>
          )}
      </HStack>
    </Button>
  );
});
