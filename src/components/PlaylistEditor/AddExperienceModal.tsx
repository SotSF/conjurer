import { observer } from "mobx-react-lite";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { trpc } from "@/src/utils/trpc";

export const AddExperienceModal = observer(function AddExperienceModal() {
  const store = useStore();
  const { uiStore, playlistStore, usingLocalData } = store;

  const {
    isPending,
    isError,
    data: experiences,
  } = trpc.experience.listExperiences.useQuery(
    { usingLocalData },
    { enabled: uiStore.showingPlaylistAddExperienceModal }
  );

  if (isError) return null;

  const onClose = action(
    () => (uiStore.showingPlaylistAddExperienceModal = false)
  );

  return (
    <Modal
      onClose={onClose}
      isOpen={uiStore.showingPlaylistAddExperienceModal}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Add experience to playlist {isPending && <Spinner />}
        </ModalHeader>
        <ModalBody>
          <VStack height="60vh" overflowY="scroll">
            {!isPending &&
              experiences.map((experience) => (
                <Button
                  key={experience.name}
                  variant="link"
                  onClick={() => playlistStore.addExperience(experience.name)}
                >
                  {experience.name}
                </Button>
              ))}
          </VStack>
        </ModalBody>
        <ModalCloseButton />
      </ModalContent>
    </Modal>
  );
});
