import { useMemo, useState } from "react";
import { ImClock } from "react-icons/im";
import {
  Button,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";

import { Block } from "@/src/types/Block";
import { ScalarInput } from "@/src/components/ScalarInput";
import { observer } from "mobx-react-lite";

type PatternTimingModalProps = {
  block: Block;
};

export const PatternTimingModal = observer(function PatternTimingModal({
  block,
}: PatternTimingModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [startTime, setStartTime] = useState(block.startTime.toString());
  const [endTime, setEndTime] = useState(block.endTime.toString());
  const [duration, setDuration] = useState(block.duration.toString());

  const isValid = useMemo(() => {
    const startTimeNumber = parseFloat(startTime);
    const endTimeNumber = parseFloat(endTime);
    const durationNumber = parseFloat(duration);

    return (
      !isNaN(startTimeNumber) &&
      !isNaN(endTimeNumber) &&
      !isNaN(durationNumber) &&
      startTimeNumber >= 0 &&
      endTimeNumber > startTimeNumber &&
      durationNumber > 0
    );
  }, [startTime, endTime, duration]);

  return (
    <>
      <IconButton
        variant="ghost"
        size="xs"
        aria-label="Timing"
        title="Timing"
        height={6}
        icon={<ImClock size={15} />}
        onClick={onOpen}
      />

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adjust Pattern Timing</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <ScalarInput
                name="Start time (s)"
                onChange={(valueString, valueNumber) => {
                  setStartTime(valueString);
                  if (!isNaN(valueNumber) && valueNumber > 0) {
                    if (valueNumber > +endTime) {
                      setEndTime((valueNumber + +duration).toString());
                    } else {
                      setDuration((+endTime - valueNumber).toString());
                    }
                  }
                }}
                value={startTime}
              />

              <ScalarInput
                name="End time (s)"
                onChange={(valueString, valueNumber) => {
                  setEndTime(valueString);
                  if (!isNaN(valueNumber) && valueNumber > +startTime) {
                    setDuration((valueNumber - +startTime).toString());
                  }
                }}
                value={endTime}
              />

              <ScalarInput
                name="Duration (s)"
                onChange={(valueString, valueNumber) => {
                  setDuration(valueString);
                  if (!isNaN(valueNumber) && valueNumber > 0) {
                    setEndTime((+startTime + valueNumber).toString());
                  }
                }}
                value={duration}
              />
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              isDisabled={!isValid}
              onClick={() => {
                onClose();
                block.setTiming({
                  startTime: parseFloat(startTime),
                  duration: parseFloat(duration),
                });
              }}
            >
              Apply
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
});
