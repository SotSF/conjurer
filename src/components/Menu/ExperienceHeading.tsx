import { observer } from "mobx-react-lite";
import { Heading, HStack, Text } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";

export const ExperienceHeading = observer(function ExperienceHeading() {
  const store = useStore();
  const { uiStore } = store;

  // Don't show if there's no experience loaded yet
  if (!store.experienceName) return null;

  return (
    <HStack position="absolute" bottom={0} m={2}>
      <Heading
        size="md"
        onClick={() =>
          store.context === "experienceEditor" &&
          uiStore.attemptShowSaveExperienceModal()
        }
        cursor="pointer"
      >
        {store.experienceName}
      </Heading>
      {store.experienceUser && (
        <Text ml={2} fontSize="sm" userSelect="none">
          by {store.experienceUser.username}
        </Text>
      )}
    </HStack>
  );
});
