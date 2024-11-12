import { observer } from "mobx-react-lite";
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { LatencyTest } from "@/src/components/LatencyModal/LatencyTest";
import { action } from "mobx";

export const LatencyModal = observer(function LatencyModal() {
  const store = useStore();
  const { audioStore, uiStore } = store;

  const isOpen = uiStore.showingLatencyModal;
  const onClose = action(() => (uiStore.showingLatencyModal = false));

  return (
    <Modal onClose={onClose} isOpen={isOpen} isCentered size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Set audio latency</ModalHeader>
        <ModalBody>
          <LatencyTest
            setLatency={action((latency) => {
              audioStore.audioLatency = latency;
              onClose();
            })}
          />
        </ModalBody>
        <ModalCloseButton />
      </ModalContent>
    </Modal>
  );
});
