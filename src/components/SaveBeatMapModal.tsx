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
import { trpc } from "@/src/utils/trpc";

export const SaveBeatMapModal = observer(function SaveBeatMapModal() {
  const store = useStore();
  const { audioStore, beatMapStore, uiStore, usingLocalData } = store;

  const {
    isPending,
    isError,
    data: beatMaps,
  } = trpc.beatMap.listBeatMaps.useQuery(
    {
      usingLocalData,
    },
    { enabled: uiStore.showingLoadBeatMapModal },
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const { selectedSong } = audioStore;
  const selectedAudioName = selectedSong.filename.split(".")[0];
  const [beatMapName, setBeatMapName] = useState(selectedAudioName);

  useEffect(() => {
    if (inputRef.current && !isPending) inputRef.current.focus();
  }, [isPending]);

  const onClose = action(() => (uiStore.showingSaveBeatMapModal = false));

  const onSaveBeatMap = action(async () => {
    setSaving(true);
    await beatMapStore.save(beatMapName, beatMapStore.stringifyBeatMap());
    setSaving(false);
    onClose();
  });

  const onBeatMapFilenameChange = (newValue: string) => {
    // sanitize file name for s3
    newValue = newValue.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    setBeatMapName(newValue);
  };

  if (isError) return;

  const willOverwriteExistingBeatMap = beatMaps?.includes(
    `${beatMapName}.json`,
  );

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
          {isPending ? (
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
