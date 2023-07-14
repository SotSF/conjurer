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
  useMultiStyleConfig,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useRef, useState } from "react";
import { action } from "mobx";
import { PaletteVariationGraph } from "@/src/components/VariationGraph/PaletteVariationGraph";
import { PaletteVariation } from "@/src/types/Variations/PaletteVariation";
import { Block } from "@/src/types/Block";

type PaletteEditorProps = {
  uniformName: string;
  variation: PaletteVariation;
  block: Block;
};

export const PaletteEditor = observer(function PaletteEditor({
  uniformName,
  variation,
  block,
}: PaletteEditorProps) {
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
    <HStack>
      <PaletteVariationGraph
        uniformName={uniformName}
        variation={variation}
        width={300}
        block={block}
      />
    </HStack>
  );
});
