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
import { trpc } from "@/src/utils/trpc";

export const LoadBeatMapModal = observer(function LoadBeatMapModal() {
  const store = useStore();
  const { beatMapStore, uiStore } = store;

  const {
    isPending,
    isError,
    data: beatMaps,
  } = trpc.beatMap.listBeatMaps.useQuery(
    {
      usingLocalAssets: store.usingLocalAssets,
    },
    { enabled: uiStore.showingLoadBeatMapModal }
  );

  const onClose = action(() => (uiStore.showingLoadBeatMapModal = false));

  const onOpenBeatMap = action(async (beatMapFilename: string) => {
    await beatMapStore.load(beatMapFilename);
    uiStore.showingBeatGridOverlay = true;
    onClose();
  });

  if (isError) return;

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
          {isPending ? (
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
