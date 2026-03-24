import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  Wrap,
  WrapItem,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { FaTrashAlt } from "react-icons/fa";

import type { VJCanopySession } from "@/src/components/VJPage/useVJCanopySession";
import { SerializedBlock } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { trpc } from "@/src/utils/trpc";

type Props = {
  session: VJCanopySession;
  accentColor: string;
  /** Which VJ session is being edited (for copy in the save dialog). */
  editingLabel: "Live" | "Preview";
  deletePresetMode: boolean;
  onDeletePresetModeChange: (value: boolean) => void;
};

function buildSuggestedPresetBaseName(session: VJCanopySession): string {
  const patternName = session.selectedPatternBlock.pattern.name;
  const effectNames = session.selectedEffectIndices
    .map((index) => session.effectBlocks[index]?.pattern.name)
    .filter((name): name is string => Boolean(name));
  return effectNames.length > 0
    ? [patternName, ...effectNames].join(" ")
    : patternName;
}

/** If `base` matches an existing preset name, returns `base + " " + n` for the lowest n ≥ 2 that is unused. */
function uniquifyPresetName(
  base: string,
  existingNames: Iterable<string>,
): string {
  const taken = new Set(existingNames);
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base} ${n}`)) n += 1;
  return `${base} ${n}`;
}

function defaultPresetNameForSession(
  session: VJCanopySession,
  savedPresets: { name: string }[] | undefined,
): string {
  const base = buildSuggestedPresetBaseName(session);
  const names = savedPresets?.map((p) => p.name) ?? [];
  return uniquifyPresetName(base, names);
}

export const VJPresetsControls = observer(function VJPresetsControls({
  session,
  accentColor,
  editingLabel,
  deletePresetMode,
  onDeletePresetModeChange,
}: Props) {
  const store = useStore();
  const { userStore, usingLocalData } = store;
  const { username } = userStore;
  const toast = useToast();
  const utils = trpc.useUtils();

  const [newPresetName, setNewPresetName] = useState("");
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

  const {
    isOpen: saveModalOpen,
    onOpen: openSaveModalBase,
    onClose: closeSaveModal,
  } = useDisclosure();

  const openSaveModal = useCallback(() => {
    setNewPresetName(defaultPresetNameForSession(session, presets));
    openSaveModalBase();
  }, [session, presets, openSaveModalBase]);

  const createMutation = trpc.vjPreset.create.useMutation({
    onSuccess: () => {
      void utils.vjPreset.list.invalidate();
      closeSaveModal();
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
      onDeletePresetModeChange(false);
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

  const loadPresetRow = (row: { serializedBlock?: unknown }) => {
    if (row.serializedBlock === undefined) return;
    session.applySerializedPreset(row.serializedBlock as SerializedBlock);
  };

  const deletePresetById = (id: number) => {
    deleteMutation.mutate({
      usingLocalData,
      username,
      id,
    });
  };

  const suggestedSaveName = defaultPresetNameForSession(session, presets);

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
        <HStack justify="space-between" align="center" mb={2}>
          <Text fontSize="xs" fontWeight="bold" color="gray.300">
            Presets
          </Text>
          <IconButton
            size="xs"
            variant={deletePresetMode ? "solid" : "ghost"}
            colorScheme="red"
            aria-label={
              deletePresetMode
                ? "Exit delete preset mode"
                : "Enter delete preset mode"
            }
            title={
              deletePresetMode
                ? "Done deleting presets"
                : "Delete presets (preset buttons show trash; click to delete)"
            }
            icon={<FaTrashAlt />}
            onClick={() => onDeletePresetModeChange(!deletePresetMode)}
          />
        </HStack>
        {listError && (
          <Text fontSize="xs" color="red.300" mb={2}>
            Could not load presets.
          </Text>
        )}
        <VStack align="stretch" spacing={2}>
          {listPending && (
            <Text fontSize="xs" color="gray.500">
              Loading presets…
            </Text>
          )}
          {!listPending && !presets?.length && !listError && (
            <Text fontSize="xs" color="gray.500">
              No saved presets yet.
            </Text>
          )}
          <Wrap spacing={2} shouldWrapChildren align="center">
            <WrapItem maxW="100%">
              <Button
                size="sm"
                variant="outline"
                borderColor="gray.500"
                color="gray.200"
                _hover={{ bg: "whiteAlpha.100", borderColor: "gray.400" }}
                px={2}
                maxW="320px"
                w="100%"
                isTruncated
                title={`+ Save ${suggestedSaveName}`}
                onClick={openSaveModal}
              >
                + Save {suggestedSaveName}
              </Button>
            </WrapItem>
            {presets?.map((p) => (
              <WrapItem key={p.id}>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor={accentColor}
                  color={accentColor}
                  maxW="240px"
                  rightIcon={deletePresetMode ? <FaTrashAlt /> : undefined}
                  title={
                    deletePresetMode ? `Delete “${p.name}”` : `Load “${p.name}”`
                  }
                  aria-label={
                    deletePresetMode
                      ? `Delete preset ${p.name}`
                      : `Load preset ${p.name}`
                  }
                  onClick={() =>
                    deletePresetMode ? deletePresetById(p.id) : loadPresetRow(p)
                  }
                  isDisabled={listPending || deleteMutation.isPending}
                  _hover={{ bg: "whiteAlpha.100" }}
                >
                  <Text
                    as="span"
                    display="block"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                    textAlign="left"
                  >
                    {p.name}
                  </Text>
                </Button>
              </WrapItem>
            ))}
          </Wrap>
        </VStack>
      </Box>

      <Modal isOpen={saveModalOpen} onClose={closeSaveModal} isCentered>
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
              Saves the current pattern, parameters, variations, and effect
              chain for your <strong>{editingLabel}</strong> session.
            </Text>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" mr={3} onClick={closeSaveModal}>
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
    </>
  );
});
