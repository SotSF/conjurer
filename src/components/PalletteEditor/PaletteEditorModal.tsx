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
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { PaletteEditor } from "@/src/components/PalletteEditor/PaletteEditor";
import { PaletteVariation } from "@/src/types/Variations/PaletteVariation";
import { Block } from "@/src/types/Block";
import { Palette } from "@/src/types/Palette";

type PaletteEditorModalProps = {
  uniformName: string;
  variation: PaletteVariation;
  block: Block;
  setPalette?: (palette: Palette) => void;
};

export const PaletteEditorModal = observer(function PaletteEditorModal({
  uniformName,
  variation,
  block,
  setPalette,
}: PaletteEditorModalProps) {
  const { uiStore } = useStore();
  const onClose = action(() => (uiStore.showingPaletteEditorModal = false));

  return (
    <Modal
      onClose={onClose}
      isOpen={uiStore.showingPaletteEditorModal}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Palette editor</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <PaletteEditor
            uniformName={uniformName}
            variation={variation}
            block={block}
            setPalette={setPalette}
          />
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Done</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
