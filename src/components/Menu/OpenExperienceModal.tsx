import { observer } from "mobx-react-lite";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { trpc } from "@/src/utils/trpc";
import { GiSparkles } from "react-icons/gi";
import { useState } from "react";

export const OpenExperienceModal = observer(function OpenExperienceModal() {
  const store = useStore();
  const { experienceStore, uiStore, username, usingLocalData } = store;

  const {
    isPending,
    isError,
    data: experiences,
    isRefetching,
  } = trpc.experience.listExperiences.useQuery(
    { username, usingLocalData },
    { enabled: uiStore.showingOpenExperienceModal }
  );

  const [isLoadingNewExperience, setIsLoadingNewExperience] = useState(false);

  const onClose = action(() => (uiStore.showingOpenExperienceModal = false));

  if (isError) return null;

  const sortedExperiences = (experiences ?? []).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <Modal
      onClose={onClose}
      isOpen={uiStore.showingOpenExperienceModal}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Open experience{" "}
          {(isPending || isRefetching || isLoadingNewExperience) && (
            <Spinner ml={2} />
          )}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!isPending && experiences.length === 0 && (
            <Text color="gray.400">
              {username} has no saved experiences yet!
            </Text>
          )}
          {!isPending && (
            <VStack alignItems="center">
              {sortedExperiences.map((experience) => (
                <Button
                  key={experience.id}
                  leftIcon={<GiSparkles />}
                  width="100%"
                  onClick={action(async () => {
                    setIsLoadingNewExperience(true);
                    await experienceStore.load(experience.name);
                    setIsLoadingNewExperience(false);
                    onClose();
                  })}
                  disabled={isLoadingNewExperience}
                >
                  {experience.name}
                </Button>
              ))}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
