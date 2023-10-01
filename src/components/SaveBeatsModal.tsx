import { observer } from "mobx-react-lite";
import {
  Button,
  HStack,
  Input,
  InputGroup,
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

// beatMapFilename = `${beatMapName}.json`

type SaveBeatsModalProps = {};

export const SaveBeatsModal = observer(function SaveBeatsModal() {
  const store = useStore();
  const { beatMapStore, uiStore } = store;

  const { loading, beatMaps } = useBeatMaps();

  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [beatMapName, setBeatMapName] = useState("");

  useEffect(() => {
    if (inputRef.current && !loading) inputRef.current.focus();
  }, [loading]);

  const onClose = action(() => {
    uiStore.showingSaveBeatsModal = false;
  });

  const saveBeatMap = async (beatMapFilename: string) => {
    if (store.usingLocalAssets) {
      fetch(`/api/beatMaps/${beatMapFilename}`, {
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

  const willOverwriteExistingBeatMap = beatMaps.includes(beatMapName);

  return (
    <Modal onClose={onClose} isOpen={uiStore.showingSaveBeatsModal} isCentered>
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
                </InputGroup>
              </HStack>
              {beatMaps.length > 0 && (
                <Text mb={4}>
                  Be aware that you may overwrite an existing experience:
                </Text>
              )}
              {beatMaps.map((b) => (
                <Text
                  key={b}
                  color={b === beatMapName ? "orange.400" : "chakra-body-text"}
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
