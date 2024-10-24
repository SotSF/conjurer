import { observer } from "mobx-react-lite";
import {
  Button,
  HStack,
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
import {
  uploadAudioFileToS3,
  uploadAudioFileToServer,
} from "@/src/utils/uploadAudio";
import { trpc } from "@/src/utils/trpc";
import { sanitize } from "@/src/utils/sanitize";

const UploadAudioModalContent = observer(function UploadAudioModalContent() {
  const store = useStore();
  const { uiStore, usingLocalData } = store;

  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [, setAudioFilename] = useState("");
  const [songName, setSongName] = useState("");
  const [artistName, setArtistName] = useState("");

  const styles = useMultiStyleConfig("Button", { variant: "outline" });

  const onClose = action(() => (uiStore.showingUploadAudioModal = false));

  const utils = trpc.useUtils();
  const createSong = trpc.song.createSong.useMutation();
  const onUpload = async () => {
    if (!inputRef.current?.files?.length) return;
    const fileToUpload = inputRef.current.files[0];

    setUploading(true);
    const filename = `${sanitize(artistName)} - ${sanitize(songName)}.mp3`;
    if (usingLocalData) {
      await uploadAudioFileToServer(fileToUpload, filename);
    } else {
      await uploadAudioFileToS3(fileToUpload, filename);
    }
    await createSong.mutateAsync({
      usingLocalData,
      name: songName,
      artist: artistName,
      filename,
    });
    await utils.song.listSongs.invalidate();
    setUploading(false);

    onClose();
  };

  return (
    <ModalContent>
      <ModalHeader>Upload audio</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <>
          <Text mb={4}>Select an audio file from your computer to upload.</Text>
          <Input
            ref={inputRef}
            type="file"
            accept=".mp3"
            pl={0}
            mb={4}
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
          <HStack mb={4}>
            <Text w={32}>Song name</Text>
            <Input
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
            />
          </HStack>
          <HStack>
            <Text w={32}>Artist</Text>
            <Input
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
            />
          </HStack>
        </>
      </ModalBody>
      <ModalFooter>
        <Button
          isDisabled={
            uploading ||
            !inputRef.current?.files?.length ||
            !songName ||
            !artistName
          }
          onClick={onUpload}
        >
          {uploading ? <Spinner /> : "Upload"}
        </Button>
      </ModalFooter>
    </ModalContent>
  );
});

export default UploadAudioModalContent;
