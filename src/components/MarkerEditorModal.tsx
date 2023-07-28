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
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useState } from "react";
import { action } from "mobx";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { AudioRegion } from "@/src/types/AudioRegion";

export const MarkerEditorModal = observer(function MarkerEditorModal() {
  const store = useStore();
  const { uiStore, audioStore } = store;

  const markerElement = uiStore.markerToEdit.content;
  const regionName =
    (typeof markerElement === "object" && markerElement.innerHTML) || "";
  const [markerName, setMarkerName] = useState(regionName);
  const [color, setColor] = useState(uiStore.markerToEdit.color || "#efa6b4");

  const onClose = action(() => {
    uiStore.showingMarkerEditorModal = false;
    uiStore.markerToEdit = {};
  });

  const onDelete = action(() => {
    const { wavesurfer, regionsPlugin } = audioStore;
    if (!wavesurfer || !regionsPlugin) return;

    regionsPlugin.getRegions().forEach((region) => {
      if (region.id === uiStore.markerToEdit.id) region.remove();
    });

    onClose();
  });

  const onSave = action(() => {
    const { wavesurfer, regionsPlugin } = audioStore;
    if (!wavesurfer || !regionsPlugin) return;

    // In case we are editing an existing marker, remove it first
    regionsPlugin.getRegions().forEach((region) => {
      if (region.id === uiStore.markerToEdit.id) region.remove();
    });

    // Create a new region with the updated name and color
    const newRegion = new AudioRegion({
      ...uiStore.markerToEdit,
      start: uiStore.markerToEdit.start || 0,
      color,
      content: markerName,
    }).withNewContentElement();
    regionsPlugin.addRegion(newRegion);

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
        <ModalBody>
          <>
            <Input
              value={markerName}
              onChange={(e) => setMarkerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSave()}
              placeholder="Marker name"
            />
            <VStack>
              <HexColorInput
                className="hexColorInput"
                color={color}
                onChange={setColor}
              />
              <HexColorPicker color={color} onChange={setColor} />
            </VStack>
          </>
        </ModalBody>
        <ModalCloseButton />
        <ModalFooter>
          <Button mr={4} variant="ghost" colorScheme="red" onClick={onDelete}>
            Delete
          </Button>
          <Button isDisabled={!markerName} onClick={onSave}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
