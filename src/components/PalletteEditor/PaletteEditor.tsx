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
import { Palette } from "@/src/types/Palette";

type PaletteEditorProps = {
  uniformName: string;
  variation: PaletteVariation;
  block: Block;
  setPalette?: (palette: Palette) => void;
};

export const PaletteEditor = observer(function PaletteEditor({
  uniformName,
  variation,
  block,
  setPalette,
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

  const randomize = () => {
    variation.palette.randomize();
    if (setPalette) setPalette(variation.palette);
  };

  return (
    <HStack>
      <PaletteVariationGraph
        uniformName={uniformName}
        variation={variation}
        width={300}
        block={block}
      />
      <Button onClick={randomize}>Randomize</Button>
    </HStack>
  );
});
