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
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { useBeatMaps } from "@/src/hooks/beatMap";

export const LoadBeatMapModal = observer(function LoadBeatMapModal() {
  const store = useStore();
  const { beatMapStore, uiStore } = store;

  const { loading, beatMaps } = useBeatMaps(uiStore.showingLoadBeatMapModal);

  const onClose = action(() => (uiStore.showingLoadBeatMapModal = false));

  const onOpenBeatMap = async (beatMapFilename: string) => {
    await beatMapStore.load(beatMapFilename);
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      isOpen={uiStore.showingLoadBeatMapModal}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Open beat map</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loading ? (
            <Spinner />
          ) : (
            <>
              {beatMaps.length === 0 && (
                <Text color="gray.400">
                  {store.user} has no saved experiences yet!
                </Text>
              )}
              <VStack align="flex-start" spacing={0}>
                {beatMaps.map((beatMapFilename) => (
                  <Button
                    key={beatMapFilename}
                    variant="ghost"
                    onClick={() => onOpenBeatMap(beatMapFilename)}
                  >
                    {beatMapFilename}
                  </Button>
                ))}
              </VStack>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
