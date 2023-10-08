import { observer } from "mobx-react-lite";
import {
  Button,
  HStack,
  Input,
  InputGroup,
  InputRightAddon,
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
import { useEffect, useRef, useState } from "react";
import { action } from "mobx";
import { useBeatMaps } from "@/src/hooks/beatMap";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
  ASSET_BUCKET_NAME,
  BEAT_MAP_ASSET_PREFIX,
  getS3,
} from "@/src/utils/assets";

// For reference:
// beatMapFilename = `${beatMapName}.json`

export const SaveBeatMapModal = observer(function SaveBeatMapModal() {
  const store = useStore();
  const { audioStore, beatMapStore, uiStore } = store;

  const { loading, beatMaps } = useBeatMaps(uiStore.showingSaveBeatMapModal);

  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const { selectedAudioFile } = audioStore;
  const selectedAudioName = selectedAudioFile.split(".")[0];
  const [beatMapName, setBeatMapName] = useState(selectedAudioName);

  useEffect(() => {
    if (inputRef.current && !loading) inputRef.current.focus();
  }, [loading]);

  const onClose = action(() => (uiStore.showingSaveBeatMapModal = false));

  const saveBeatMap = async (beatMapFilename: string) => {
    if (store.usingLocalAssets) {
      fetch(`/api/beat-maps/${beatMapFilename}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ beatMap: beatMapStore.serialize() }),
      });
      return;
    }

    const putObjectCommand = new PutObjectCommand({
      Bucket: ASSET_BUCKET_NAME,
      Key: `${BEAT_MAP_ASSET_PREFIX}${beatMapFilename}.json`,
      Body: JSON.stringify(beatMapStore.beatMap.serialize()),
    });

    return getS3().send(putObjectCommand);
  };

  const onSaveBeatMap = async () => {
    setSaving(true);

    await saveBeatMap(beatMapName);
    setSaving(false);
    onClose();
  };

  const onBeatMapFilenameChange = (newValue: string) => {
    // sanitize file name for s3
    newValue = newValue.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    setBeatMapName(newValue);
  };

  const willOverwriteExistingBeatMap = beatMaps.includes(`${beatMapName}.json`);

  return (
    <Modal
      onClose={onClose}
      isOpen={uiStore.showingSaveBeatMapModal}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Save beat map as...</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loading ? (
            <Spinner />
          ) : (
            <>
              <HStack mb={2} spacing={0}>
                <InputGroup>
                  <Input
                    ref={inputRef}
                    onChange={(e) => onBeatMapFilenameChange(e.target.value)}
                    value={beatMapName}
                  />
                  <InputRightAddon>.json</InputRightAddon>
                </InputGroup>
              </HStack>
              {beatMaps.length > 0 && (
                <Text mb={4}>
                  Be aware that you may overwrite an existing beat map:
                </Text>
              )}
              {beatMaps.map((b) => (
                <Text
                  key={b}
                  color={
                    b === `${beatMapName}.json`
                      ? "orange.400"
                      : "chakra-body-text"
                  }
                  fontWeight="bold"
                >
                  {b}
                </Text>
              ))}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            isDisabled={saving || !beatMapName}
            onClick={() => onSaveBeatMap()}
            colorScheme={willOverwriteExistingBeatMap ? "red" : "gray"}
          >
            {saving ? (
              <Spinner />
            ) : willOverwriteExistingBeatMap ? (
              "Overwrite"
            ) : (
              "Save"
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
