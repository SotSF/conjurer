import { HStack, Text } from "@chakra-ui/react";
import { ExperienceStatus } from "@/src/types/Experience";

type ExperienceStatusProps = {
  experienceStatus: ExperienceStatus;
  withLabel?: boolean;
};

export const ExperienceStatusIndicator = ({
  experienceStatus,
  withLabel,
}: ExperienceStatusProps) => {
  switch (experienceStatus) {
    case "inprogress":
      return (
        <HStack>
          <Text>🟡</Text>
          {withLabel && <Text>In Progress</Text>}
        </HStack>
      );
    case "complete":
      return (
        <HStack>
          <Text>🟢</Text>
          {withLabel && <Text>Complete</Text>}
        </HStack>
      );
  }
};
