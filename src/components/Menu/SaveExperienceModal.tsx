import { observer } from "mobx-react-lite";
import {
  Button,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useExperiences } from "@/src/hooks/experiences";

export const SaveExperienceModal = observer(function SaveExperienceModal() {
  const store = useStore();
  const { experienceStore, uiStore } = store;

  const { loading, experiences } = useExperiences(
    uiStore.showingSaveExperienceModal
  );

  const onClose = () => {
    uiStore.showingSaveExperienceModal = false;
  };
  const onSaveExperience = async () => {
    // TODO: save experience
    // onClose();
  };
  return (
    <Modal
      onClose={onClose}
      isOpen={uiStore.showingSaveExperienceModal}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Save experience as...</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {store.user ? (
            loading ? (
              <Spinner />
            ) : (
              <>
                <HStack mb={2} spacing={0}>
                  <Text>{store.user}-</Text>
                  <Input></Input>
                </HStack>
                {experiences.length > 0 && (
                  <Text>Careful not to overwrite an existing experience:</Text>
                )}
                {experiences.map((experience) => (
                  <Text key={experience} fontWeight="bold">
                    {experience}
                  </Text>
                ))}
              </>
            )
          ) : (
            <Text>Please log in first!</Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => onSaveExperience()}>Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
