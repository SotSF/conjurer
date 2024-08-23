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
import { useExperiences } from "@/src/hooks/experiences";
import { action } from "mobx";

export const OpenExperienceModal = observer(function OpenExperienceModal() {
  const store = useStore();
  const { experienceStore, uiStore } = store;

  const { loading, experiences } = useExperiences(
    uiStore.showingOpenExperienceModal
  );

  const onClose = action(() => (uiStore.showingOpenExperienceModal = false));

  const onOpenExperience = async (experienceFilename: string) => {
    await experienceStore.load(experienceFilename);
    onClose();
  };

  // are the last fetched experiences for a different user?
  const areExperiencesStale =
    experiences.length > 0 &&
    store.user.length > 0 &&
    !experiences[0].startsWith(store.user);

  return (
    <Modal
      onClose={onClose}
      isOpen={uiStore.showingOpenExperienceModal}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Open experience {loading && <Spinner ml={2} />}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {store.user ? (
            areExperiencesStale ? (
              <Spinner />
            ) : (
              <>
                {experiences.length === 0 && !loading && (
                  <Text color="gray.400">
                    {store.user} has no saved experiences yet!
                  </Text>
                )}
                <VStack align="flex-start" spacing={0}>
                  {experiences.map((experience) => (
                    <Button
                      key={experience}
                      variant="ghost"
                      onClick={() => onOpenExperience(experience)}
                    >
                      {experience}
                    </Button>
                  ))}
                </VStack>
              </>
            )
          ) : (
            <Text>Please log in first!</Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
