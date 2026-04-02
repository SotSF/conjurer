import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Select,
  Switch,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { FaArrowDown, FaArrowUp, FaTrash } from "react-icons/fa";
import { MdTune } from "react-icons/md";

import type { VjMidiDeviceConfigsFile } from "@/src/utils/vjMidiDeviceStorage";

type VJMidiModalProps = {
  midiLoggingEnabled: boolean;
  onMidiLoggingChange: (enabled: boolean) => void;
  midiDeviceFile: VjMidiDeviceConfigsFile;
  onMidiDeviceFileChange: (next: VjMidiDeviceConfigsFile) => void;
  midiCcLearnActive: boolean;
  onBeginMidiCcLearn: () => void;
  onStopMidiCcLearn: () => void;
};

function clampCc(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(127, Math.max(0, Math.round(n)));
}

function mergePortOptions(
  connected: string[],
  saved: string | null,
): string[] {
  const set = new Set(connected);
  if (saved && saved.length > 0 && !set.has(saved)) {
    return [saved, ...connected];
  }
  return connected;
}

export function VJMidiModal({
  midiLoggingEnabled,
  onMidiLoggingChange,
  midiDeviceFile,
  onMidiDeviceFileChange,
  midiCcLearnActive,
  onBeginMidiCcLearn,
  onStopMidiCcLearn,
}: VJMidiModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [midiInputNames, setMidiInputNames] = useState<string[]>([]);

  const handleModalClose = () => {
    onStopMidiCcLearn();
    onClose();
  };

  useEffect(() => {
    return () => {
      onStopMidiCcLearn();
    };
  }, [onStopMidiCcLearn]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
      return;
    }
    let cancelled = false;
    let access: MIDIAccess | null = null;

    const refresh = () => {
      if (!access) return;
      const names = Array.from(access.inputs.values())
        .map((i) => i.name)
        .filter((n): n is string => typeof n === "string" && n.length > 0);
      if (!cancelled) setMidiInputNames(names);
    };

    void navigator
      .requestMIDIAccess({ sysex: false })
      .then((a) => {
        if (cancelled) return;
        access = a;
        refresh();
        access.onstatechange = refresh;
      })
      .catch(() => {
        /* no permission */
      });

    return () => {
      cancelled = true;
      if (access) access.onstatechange = null;
    };
  }, []);

  const portName = midiDeviceFile.lastPortName ?? "";
  const ccNumbers: number[] = portName
    ? (midiDeviceFile.byPortName[portName]?.ccNumbers ?? [])
    : [];

  const portOptions = useMemo(
    () => mergePortOptions(midiInputNames, midiDeviceFile.lastPortName),
    [midiInputNames, midiDeviceFile.lastPortName],
  );

  const setPortName = (nextPort: string) => {
    onStopMidiCcLearn();
    onMidiDeviceFileChange({
      ...midiDeviceFile,
      lastPortName: nextPort.length > 0 ? nextPort : null,
    });
  };

  const setCcNumbers = (next: number[]) => {
    const name = midiDeviceFile.lastPortName;
    if (!name) return;
    onMidiDeviceFileChange({
      ...midiDeviceFile,
      byPortName: {
        ...midiDeviceFile.byPortName,
        [name]: { ccNumbers: next.map(clampCc) },
      },
    });
  };

  const onCcChange = (index: number, value: number) => {
    const next = [...ccNumbers];
    next[index] = clampCc(value);
    setCcNumbers(next);
  };

  const addSlot = () => {
    setCcNumbers([...ccNumbers, 0]);
  };

  const removeSlot = (index: number) => {
    setCcNumbers(ccNumbers.filter((_, i) => i !== index));
  };

  const moveSlot = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= ccNumbers.length) return;
    const next = [...ccNumbers];
    const a = next[index];
    const b = next[j];
    if (a === undefined || b === undefined) return;
    next[index] = b;
    next[j] = a;
    setCcNumbers(next);
  };

  const midiSupported =
    typeof navigator !== "undefined" && !!navigator.requestMIDIAccess;

  return (
    <>
      <Button
        aria-label="Configure MIDI"
        leftIcon={<MdTune />}
        size="sm"
        variant="ghost"
        color="gray.100"
        _hover={{ bg: "whiteAlpha.200" }}
        onClick={onOpen}
      >
        Configure MIDI
      </Button>
      <Modal isOpen={isOpen} onClose={handleModalClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.600">
          <ModalHeader>MIDI</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="stretch" spacing={4}>
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="vj-midi-logging" mb={0} flex="1">
                  Console MIDI logging
                </FormLabel>
                <Switch
                  id="vj-midi-logging"
                  isChecked={midiLoggingEnabled}
                  onChange={(e) => onMidiLoggingChange(e.target.checked)}
                />
              </FormControl>
              <Text fontSize="sm" color="gray.400">
                When enabled, each MIDI message is pretty-printed to the browser
                developer console (channel, CC number, values, raw hex).
              </Text>

              <Divider borderColor="gray.600" />

              <Text fontSize="sm" fontWeight="semibold" color="gray.100">
                CC mapping
              </Text>
              {!midiSupported ? (
                <Text fontSize="sm" color="gray.500">
                  Web MIDI is not available in this browser.
                </Text>
              ) : (
                <>
                  <FormControl>
                    <FormLabel fontSize="sm" color="gray.300">
                      MIDI input (device)
                    </FormLabel>
                    <Select
                      placeholder="Select device"
                      value={portName}
                      onChange={(e) => setPortName(e.target.value)}
                      bg="gray.900"
                      borderColor="gray.600"
                      size="sm"
                    >
                      {portOptions.map((name) => (
                        <option key={name} value={name}>
                          {midiInputNames.includes(name)
                            ? name
                            : `${name} (saved, not connected)`}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <Text fontSize="sm" color="gray.400">
                    The ordered list maps to scalar sliders in the pattern panel (first
                    CC → first slider, and so on). Only this device is used when the list
                    is non-empty. Leave the list empty for legacy mode: any CC / pitch
                    bend controls the first scalar only.
                  </Text>

                  {portName ? (
                    <VStack align="stretch" spacing={3}>
                      <Box
                        borderWidth="1px"
                        borderRadius="md"
                        borderColor={midiCcLearnActive ? "blue.400" : "gray.600"}
                        bg={midiCcLearnActive ? "whiteAlpha.50" : "transparent"}
                        px={3}
                        py={3}
                      >
                        <Text fontSize="sm" fontWeight="medium" color="gray.100" mb={2}>
                          Learn from controller
                        </Text>
                        {midiCcLearnActive ? (
                          <>
                            <Text fontSize="sm" color="blue.200" mb={3}>
                              Listening — move each knob or slider once, in the order
                              you want. Repeating the same control does not add it
                              again. Click done when finished.
                            </Text>
                            <HStack spacing={2} flexWrap="wrap">
                              <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={onStopMidiCcLearn}
                              >
                                Done
                              </Button>
                              <Text fontSize="xs" color="gray.500">
                                {ccNumbers.length} CC
                                {ccNumbers.length === 1 ? "" : "s"} captured
                              </Text>
                            </HStack>
                          </>
                        ) : (
                          <>
                            <Text fontSize="sm" color="gray.400" mb={3}>
                              Clears the current list, then records each CC number as
                              you touch controls in order.
                            </Text>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              variant="outline"
                              borderColor="blue.400"
                              color="blue.200"
                              _hover={{ bg: "whiteAlpha.100" }}
                              onClick={onBeginMidiCcLearn}
                              isDisabled={!portName}
                              title={
                                !portName ? "Select a MIDI input first." : undefined
                              }
                            >
                              Listen for MIDI controls
                            </Button>
                          </>
                        )}
                      </Box>

                      <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                        Manual edit
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        {ccNumbers.map((cc, index) => (
                          <HStack key={index} spacing={2}>
                            <Text
                              fontSize="xs"
                              color="gray.500"
                              w="100px"
                              flexShrink={0}
                            >
                              Param {index + 1}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              CC
                            </Text>
                            <NumberInput
                              size="sm"
                              min={0}
                              max={127}
                              value={cc}
                              isDisabled={midiCcLearnActive}
                              onChange={(_, v) =>
                                onCcChange(index, Number.isNaN(v) ? cc : v)
                              }
                              w="88px"
                            >
                              <NumberInputField
                                bg="gray.900"
                                borderColor="gray.600"
                              />
                            </NumberInput>
                            <IconButton
                              aria-label="Move up"
                              icon={<FaArrowUp />}
                              size="xs"
                              variant="ghost"
                              isDisabled={midiCcLearnActive || index === 0}
                              onClick={() => moveSlot(index, -1)}
                            />
                            <IconButton
                              aria-label="Move down"
                              icon={<FaArrowDown />}
                              size="xs"
                              variant="ghost"
                              isDisabled={
                                midiCcLearnActive || index >= ccNumbers.length - 1
                              }
                              onClick={() => moveSlot(index, 1)}
                            />
                            <IconButton
                              aria-label="Remove"
                              icon={<FaTrash />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              isDisabled={midiCcLearnActive}
                              onClick={() => removeSlot(index)}
                            />
                          </HStack>
                        ))}
                        <Box>
                          <Button
                            size="sm"
                            variant="outline"
                            isDisabled={midiCcLearnActive}
                            onClick={addSlot}
                          >
                            Add CC slot
                          </Button>
                        </Box>
                      </VStack>
                    </VStack>
                  ) : (
                    <Text fontSize="sm" color="gray.500">
                      Choose a device to edit its CC list.
                    </Text>
                  )}
                </>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
