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
import { FaArrowDown, FaArrowUp, FaMusic, FaTrash } from "react-icons/fa";

import type { VjMidiDeviceConfigsFile } from "@/src/utils/vjMidiDeviceStorage";

type VJMidiModalProps = {
  midiLoggingEnabled: boolean;
  onMidiLoggingChange: (enabled: boolean) => void;
  midiDeviceFile: VjMidiDeviceConfigsFile;
  onMidiDeviceFileChange: (next: VjMidiDeviceConfigsFile) => void;
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
}: VJMidiModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [midiInputNames, setMidiInputNames] = useState<string[]>([]);

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
      <IconButton
        aria-label="MIDI settings"
        icon={<FaMusic />}
        size="sm"
        variant="ghost"
        color="gray.100"
        _hover={{ bg: "whiteAlpha.200" }}
        onClick={onOpen}
      />
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
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
                    Ordered CC numbers: the first maps to the first scalar slider in
                    the pattern panel (non-jumpy numeric params), the second to the
                    next, and so on. Only this device is used when the list is
                    non-empty. Leave the list empty to use any CC / pitch bend on the
                    first scalar only.
                  </Text>

                  {portName ? (
                    <VStack align="stretch" spacing={2}>
                      {ccNumbers.map((cc, index) => (
                        <HStack key={index} spacing={2}>
                          <Text fontSize="xs" color="gray.500" w="100px" flexShrink={0}>
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
                            onChange={(_, v) =>
                              onCcChange(index, Number.isNaN(v) ? cc : v)
                            }
                            w="88px"
                          >
                            <NumberInputField bg="gray.900" borderColor="gray.600" />
                          </NumberInput>
                          <IconButton
                            aria-label="Move up"
                            icon={<FaArrowUp />}
                            size="xs"
                            variant="ghost"
                            isDisabled={index === 0}
                            onClick={() => moveSlot(index, -1)}
                          />
                          <IconButton
                            aria-label="Move down"
                            icon={<FaArrowDown />}
                            size="xs"
                            variant="ghost"
                            isDisabled={index >= ccNumbers.length - 1}
                            onClick={() => moveSlot(index, 1)}
                          />
                          <IconButton
                            aria-label="Remove"
                            icon={<FaTrash />}
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => removeSlot(index)}
                          />
                        </HStack>
                      ))}
                      <Box>
                        <Button size="sm" variant="outline" onClick={addSlot}>
                          Add CC slot
                        </Button>
                      </Box>
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
