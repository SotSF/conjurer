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
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useState } from "react";
import { action } from "mobx";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { hexToRgbaString, rgbaStringToHex } from "@/src/utils/color";
import { RegionParams } from "wavesurfer.js/dist/plugins/regions";

export const MarkerEditorModal = observer(function MarkerEditorModal() {
  const store = useStore();
  const { uiStore, audioStore } = store;

  const markerElement = uiStore.markerToEdit.content;
  const regionName =
    (typeof markerElement === "object" && markerElement.innerHTML) || "";
  const [markerName, setMarkerName] = useState(regionName);
  const [color, setColor] = useState(
    uiStore.markerToEdit.color
      ? rgbaStringToHex(uiStore.markerToEdit.color)
      : "#efa6b4"
  );

  const onClose = action(() => {
    uiStore.showingMarkerEditorModal = false;
    uiStore.markerToEdit = {};
  });

  const onDone = action(() => {
    const { wavesurfer, regions } = audioStore;

    if (!wavesurfer || !regions) return;
    const label = document.createElement("div");
    label.innerHTML = markerName;
    label.setAttribute("style", "width: 100px; color: black; font-size: 12px;");
    const newRegion: RegionParams = {
      ...uiStore.markerToEdit,
      start: uiStore.markerToEdit.start || 0,
      color: hexToRgbaString(color, 0.4),
      content: label,
    };

    // In case we are editing an existing marker, remove it first
    regions.getRegions().forEach((region) => {
      if (region.id === uiStore.markerToEdit.id) region.remove();
    });
    regions.addRegion(newRegion);

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
        <ModalFooter>
          <Button isDisabled={!markerName} onClick={onDone}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
