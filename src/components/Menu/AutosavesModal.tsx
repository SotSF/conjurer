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
  HStack,
  useToast,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action, runInAction } from "mobx";
import { useCallback, useEffect, useState } from "react";
import {
  AutosaveMeta,
  getAutosave,
  listAutosaves,
  MAX_AUTOSAVES,
} from "@/src/utils/autosavePersistence";

const formatAutosaveTime = (savedAt: number) =>
  Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(savedAt);

export const AutosavesModal = observer(function AutosavesModal() {
  const store = useStore();
  const { uiStore, experienceStore } = store;
  const toast = useToast();

  const [autosaves, setAutosaves] = useState<AutosaveMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoringId, setIsRestoringId] = useState<number | null>(null);

  const onClose = action(() => {
    uiStore.showingAutosavesModal = false;
  });

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await listAutosaves(experienceStore.autosaveExperienceKey);
      setAutosaves(records);
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to load autosaves",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setAutosaves([]);
    } finally {
      setIsLoading(false);
    }
  }, [experienceStore.autosaveExperienceKey, toast]);

  useEffect(() => {
    if (!uiStore.showingAutosavesModal) return;
    void refresh();
  }, [uiStore.showingAutosavesModal, refresh]);

  const restoreAutosave = async (id: number) => {
    if (
      !confirm(
        "Load this autosave? Unsaved changes in the current experience will be replaced.",
      )
    ) {
      return;
    }

    setIsRestoringId(id);
    try {
      const record = await getAutosave(id);
      if (!record) {
        toast({
          title: "Autosave not found",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        await refresh();
        return;
      }

      runInAction(() => {
        experienceStore.loadFromAutosaveSnapshot(record.snapshot);
      });

      toast({
        title: "Autosave loaded",
        description: formatAutosaveTime(record.savedAt),
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to load autosave",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRestoringId(null);
    }
  };

  return (
    <Modal
      onClose={onClose}
      isOpen={uiStore.showingAutosavesModal}
      isCentered
      size="lg"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Autosaves {isLoading && <Spinner ml={2} size="sm" />}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={3} fontSize="sm" color="gray.400">
            Up to {MAX_AUTOSAVES} local autosaves are kept for this experience.
            Autosave runs every 3 minutes when there are changes.
          </Text>
          {!isLoading && autosaves.length === 0 && (
            <Text color="gray.400">No autosaves yet for this experience.</Text>
          )}
          <VStack align="stretch" spacing={2}>
            {autosaves.map((autosave) => (
              <HStack
                key={autosave.id}
                justify="space-between"
                borderWidth="1px"
                borderColor="gray.600"
                borderRadius="md"
                px={3}
                py={2}
              >
                <Text fontSize="sm">{formatAutosaveTime(autosave.savedAt)}</Text>
                <Button
                  size="sm"
                  onClick={() => void restoreAutosave(autosave.id)}
                  isLoading={isRestoringId === autosave.id}
                  isDisabled={isRestoringId != null}
                >
                  Load
                </Button>
              </HStack>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
