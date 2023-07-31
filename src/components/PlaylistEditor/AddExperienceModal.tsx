import { observer } from "mobx-react-lite";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useEffect, useState } from "react";
import { action } from "mobx";

export const AddExperienceModal = observer(function AddExperienceModal() {
  const store = useStore();
  const { uiStore, experienceStore, playlistStore } = store;

  const [experienceFilenames, setExperienceFilenames] = useState<string[]>([]);

  useEffect(() => {
    const fetchAvailableExperiences = async () => {
      setExperienceFilenames(
        await experienceStore.fetchAvailableExperiences("")
      );
    };
    fetchAvailableExperiences();
  }, [experienceStore]);

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
        <ModalHeader>Add experience to playlist</ModalHeader>
        <ModalBody>
          <VStack height="60vh" overflowY="scroll">
            {experienceFilenames.map((experienceFilename) => (
              <Button
                key={experienceFilename}
                variant="link"
                onClick={() => playlistStore.addExperience(experienceFilename)}
              >
                {experienceFilename}
              </Button>
            ))}
          </VStack>
        </ModalBody>
        <ModalCloseButton />
      </ModalContent>
    </Modal>
  );
});
