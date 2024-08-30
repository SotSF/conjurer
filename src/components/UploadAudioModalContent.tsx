import { observer } from "mobx-react-lite";
import {
  Button,
  Input,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Text,
  useMultiStyleConfig,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useRef, useState } from "react";
import { action } from "mobx";
import { uploadAudioFile } from "@/src/utils/uploadAudio";

const UploadAudioModalContent = observer(function UploadAudioModalContent() {
  const store = useStore();
  const { uiStore, audioStore } = store;

  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [, setAudioFilename] = useState("");

  const styles = useMultiStyleConfig("Button", { variant: "outline" });

  const onClose = action(() => (uiStore.showingUploadAudioModal = false));

  const onUpload = async () => {
    if (!inputRef.current?.files?.length) return;

    setUploading(true);
    await uploadAudioFile(inputRef.current.files[0]);
    await audioStore.fetchAvailableAudioFiles(true);
    setUploading(false);

    onClose();
  };

  return (
    <ModalContent>
      <ModalHeader>Upload audio</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <>
          <Text mb={4}>
            Select an audio file from your computer to upload. Note that
            whatever file name you upload the file with will be the permanent
            name of the audio file, so make sure it&apos;s something descriptive
            and be careful not to accidentally overwrite an existing file.
          </Text>
          <Text mb={4}>
            If you would like to have a file deleted, contact Ben.
          </Text>
          <Input
            ref={inputRef}
            type="file"
            accept="audio/*"
            pl={0}
            sx={{
              "::file-selector-button": {
                border: "none",
                outline: "none",
                mr: 2,
                ...styles,
              },
            }}
            onChange={() => {
              if (!inputRef.current?.files?.length) return;
              setAudioFilename(inputRef.current?.files[0]?.name);
            }}
          />
        </>
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
  );
});

export default UploadAudioModalContent;
