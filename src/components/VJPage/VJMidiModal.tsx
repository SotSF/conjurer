import {
  FormControl,
  FormLabel,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Switch,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { FaMusic } from "react-icons/fa";

type VJMidiModalProps = {
  midiLoggingEnabled: boolean;
  onMidiLoggingChange: (enabled: boolean) => void;
};

export function VJMidiModal({
  midiLoggingEnabled,
  onMidiLoggingChange,
}: VJMidiModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

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
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
