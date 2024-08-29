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

export const OpenExperienceModal = observer(function OpenExperienceModal() {
  const store = useStore();
  const { experienceStore, uiStore, user } = store;

  const {
    isPending,
    isError,
    data: experiences,
  } = trpc.experience.listExperiences.useQuery(
    { user },
    { enabled: uiStore.showingOpenExperienceModal }
  );

  const onClose = action(() => (uiStore.showingOpenExperienceModal = false));

  const onOpenExperience = async (experienceFilename: string) => {
    await experienceStore.load(experienceFilename);
    onClose();
  };

  if (isError) return null;

  return (
    <Modal
      onClose={onClose}
      isOpen={uiStore.showingOpenExperienceModal}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Open experience {isPending && <Spinner ml={2} />}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!isPending && experiences.length === 0 && (
            <Text color="gray.400">{user} has no saved experiences yet!</Text>
          )}
          {!isPending && (
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
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
