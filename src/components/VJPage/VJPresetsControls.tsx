import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";

import type { VJCanopySession } from "@/src/components/VJPage/useVJCanopySession";
import { SerializedBlock } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { trpc } from "@/src/utils/trpc";

type Props = {
  session: VJCanopySession;
  accentColor: string;
  /** Which VJ session is being edited (for copy in the save dialog). */
  editingLabel: "Live" | "Preview";
};

export const VJPresetsControls = observer(function VJPresetsControls({
  session,
  accentColor,
  editingLabel,
}: Props) {
  const store = useStore();
  const { userStore, usingLocalData } = store;
  const { username } = userStore;
  const toast = useToast();
  const utils = trpc.useUtils();

  const saveModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  const [newPresetName, setNewPresetName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  const {
    data: presets,
    isPending: listPending,
    isError: listError,
  } = trpc.vjPreset.list.useQuery(
    { usingLocalData, username },
    {
      enabled: userStore.isAuthenticated,
      staleTime: 1000 * 60,
    },
  );

  const createMutation = trpc.vjPreset.create.useMutation({
    onSuccess: () => {
      void utils.vjPreset.list.invalidate();
      saveModal.onClose();
      setNewPresetName("");
      toast({ title: "Preset saved", status: "success", duration: 2500 });
    },
    onError: (err) => {
      toast({
        title: "Could not save preset",
        description: err.message,
        status: "error",
        duration: 5000,
      });
    },
  });

  const deleteMutation = trpc.vjPreset.delete.useMutation({
    onSuccess: () => {
      void utils.vjPreset.list.invalidate();
      setSelectedPresetId("");
      deleteDialog.onClose();
      toast({ title: "Preset deleted", status: "success", duration: 2500 });
    },
    onError: (err) => {
      toast({
        title: "Could not delete preset",
        description: err.message,
        status: "error",
        duration: 5000,
      });
    },
  });

  const onSavePreset = () => {
    const trimmed = newPresetName.trim();
    if (!trimmed) {
      toast({ title: "Enter a name", status: "warning", duration: 2000 });
      return;
    }
    const serializedBlock = session.selectedPatternBlock.serialize({
      includeParams: true,
    });
    createMutation.mutate({
      usingLocalData,
      username,
      name: trimmed,
      serializedBlock,
    });
  };

  const onLoadPreset = () => {
    const id = Number(selectedPresetId);
    if (!Number.isFinite(id) || id <= 0) {
      toast({ title: "Select a preset", status: "warning", duration: 2000 });
      return;
    }
    const row = presets?.find((p) => p.id === id);
    if (!row) {
      toast({ title: "Preset not found", status: "error", duration: 3000 });
      return;
    }
    const ok = session.applySerializedPreset(
      row.serializedBlock as SerializedBlock,
    );
    if (!ok) {
      toast({
        title: "Could not load preset",
        description:
          "This preset’s pattern is not available in the current pattern list.",
        status: "warning",
        duration: 5000,
      });
      return;
    }
    toast({ title: "Preset loaded", status: "success", duration: 2500 });
  };

  const selectedRow = presets?.find(
    (p) => p.id === Number(selectedPresetId),
  );

  const onConfirmDelete = () => {
    const id = Number(selectedPresetId);
    if (!Number.isFinite(id) || id <= 0) {
      deleteDialog.onClose();
      return;
    }
    deleteMutation.mutate({ usingLocalData, username, id });
  };

  if (!userStore.isAuthenticated) {
    return (
      <Box
        w="100%"
        px={2}
        py={2}
        borderWidth={1}
        borderRadius="md"
        borderColor="gray.600"
        bg="gray.800"
      >
        <Text fontSize="sm" color="gray.400">
          Log in to save and load VJ presets (stored per user).
        </Text>
      </Box>
    );
  }

  return (
    <>
      <Box
        w="100%"
        px={2}
        py={2}
        borderWidth={1}
        borderRadius="md"
        borderColor="gray.600"
        bg="gray.800"
      >
        <Text fontSize="xs" fontWeight="bold" color="gray.300" mb={2}>
          Presets
        </Text>
        {listError && (
          <Text fontSize="xs" color="red.300" mb={2}>
            Could not load presets.
          </Text>
        )}
        <VStack align="stretch" spacing={2}>
          <HStack spacing={2} flexWrap="wrap">
            <FormControl maxW="200px" flex="1" minW="120px">
              <FormLabel fontSize="xs" mb={1} srOnly>
                Saved preset
              </FormLabel>
              <Select
                size="sm"
                placeholder={listPending ? "Loading…" : "Choose preset"}
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                isDisabled={listPending || !presets?.length}
              >
                {presets?.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            <Button
              size="sm"
              colorScheme="blue"
              variant="outline"
              onClick={onLoadPreset}
              isDisabled={!selectedPresetId || listPending}
            >
              Load
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              onClick={deleteDialog.onOpen}
              isDisabled={!selectedPresetId || listPending}
            >
              Delete
            </Button>
          </HStack>
          <Button
            size="sm"
            borderColor={accentColor}
            color={accentColor}
            variant="outline"
            _hover={{ bg: "whiteAlpha.100" }}
            onClick={saveModal.onOpen}
          >
            Save current as preset…
          </Button>
        </VStack>
      </Box>

      <Modal isOpen={saveModal.isOpen} onClose={saveModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.600">
          <ModalHeader>Save VJ preset</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="My look"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSavePreset();
                }}
              />
            </FormControl>
            <Text fontSize="xs" color="gray.400" mt={2}>
              Saves the current pattern, parameters, variations, and effect chain
              for your <strong>{editingLabel}</strong> session.
            </Text>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" mr={3} onClick={saveModal.onClose}>
              Cancel
            </Button>
            <Button
              bg={accentColor}
              color="black"
              _hover={{ opacity: 0.9 }}
              onClick={onSavePreset}
              isLoading={createMutation.isPending}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelDeleteRef}
        onClose={deleteDialog.onClose}
      >
        <AlertDialogOverlay />
        <AlertDialogContent bg="gray.800">
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Delete preset?
          </AlertDialogHeader>
          <AlertDialogBody>
            {selectedRow
              ? `Remove “${selectedRow.name}”? This cannot be undone.`
              : "Remove this preset? This cannot be undone."}
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelDeleteRef} onClick={deleteDialog.onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={onConfirmDelete}
              ml={3}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
