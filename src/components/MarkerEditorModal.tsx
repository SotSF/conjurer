import { observer } from "mobx-react-lite";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useState } from "react";
import { action } from "mobx";

export const MarkerEditorModal = observer(function MarkerEditorModal() {
  const store = useStore();
  const { uiStore, audioStore } = store;

  const [markerName, setMarkerName] = useState("");

  const onClose = action(() => {
    uiStore.showingMarkerEditorModal = false;
    uiStore.markerIdToEdit = "";
  });

  const onDone = action(() => {
    const markerLabelElement = audioStore.markerRegions.find(
      (region) => region.id === uiStore.markerIdToEdit
    )?.content;
    if (!markerLabelElement || typeof markerLabelElement === "string") return;
    markerLabelElement.innerHTML = markerName;
    onClose();
  });

  return (
    <Modal
      onClose={onClose}
      isOpen={uiStore.showingMarkerEditorModal}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit marker</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <>
            <Text mb={4}>Name this marker</Text>
            <Input
              value={markerName}
              onChange={(e) => setMarkerName(e.target.value)}
            />
          </>
        </ModalBody>
        <ModalFooter>
          <Button isDisabled={!markerName} onClick={onDone}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
