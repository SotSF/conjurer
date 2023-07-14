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
  Spinner,
  Text,
  useMultiStyleConfig,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useRef, useState } from "react";
import { action } from "mobx";
import { PaletteEditor } from "@/src/components/PalletteEditor/PaletteEditor";

export const PaletteEditorModal = observer(function PaletteEditorModal() {
  const store = useStore();
  const { uiStore, audioStore } = store;

  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [, setAudioFilename] = useState("");

  const styles = useMultiStyleConfig("Button", { variant: "outline" });

  const onClose = action(() => (uiStore.showingPaletteEditorModal = false));

  const onUpload = async () => {
    if (!inputRef.current?.files?.length) return;

    setUploading(true);
    await audioStore.uploadAudioFile(inputRef.current.files[0]);
    await audioStore.fetchAvailableAudioFiles(true);
    setUploading(false);

    onClose();
  };

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
          <PaletteEditor />
        </ModalBody>
        <ModalFooter>
          <Button
            isDisabled={uploading || !inputRef.current?.files?.length}
            onClick={onUpload}
          >
            {uploading ? <Spinner /> : "Upload"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
