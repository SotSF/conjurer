import {
  Button,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { useState } from "react";
import { TbTrashFilled, TbTrashXFilled } from "react-icons/tb";
import { Preset } from "@/src/types/Preset";
import { action } from "mobx";

type Props = { index: number; preset: Preset };

export const PresetButton = observer(function PresetButton({
  index,
  preset,
}: Props) {
  const { playgroundStore } = useStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showingEditModal, setShowingEditModal] = useState(false);

  return (
    <HStack key={index} spacing={0}>
      <Button
        size="xs"
        borderTopRightRadius={0}
        borderBottomRightRadius={0}
        onClick={() => playgroundStore.loadPreset(index)}
        onDoubleClick={() => setShowingEditModal(true)}
      >
        {preset.name ||
          `${
            typeof preset.pattern === "string"
              ? preset.pattern
              : preset.pattern.name
          } ${index + 1}`}
      </Button>
      <IconButton
        as={Button}
        size="xs"
        aria-label={confirmingDelete ? "Confirming delete" : "Delete preset"}
        title={confirmingDelete ? "Confirming delete" : "Delete preset"}
        borderTopLeftRadius={0}
        borderBottomLeftRadius={0}
        onClick={() => {
          if (confirmingDelete) {
            playgroundStore.deletePreset(index);
            setConfirmingDelete(false);
          } else {
            setConfirmingDelete(true);
          }
        }}
        icon={
          confirmingDelete ? (
            <TbTrashXFilled size={13} />
          ) : (
            <TbTrashFilled size={13} />
          )
        }
        color={confirmingDelete ? "red.500" : undefined}
      />
      {showingEditModal && (
        <Modal
          isOpen={showingEditModal}
          onClose={() => setShowingEditModal(false)}
          isCentered
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit preset</ModalHeader>
            <ModalBody>
              <VStack>
                <Text>Name</Text>
                <input
                  type="text"
                  value={preset.name || ""}
                  onChange={action((e) => {
                    preset.name = e.target.value;
                    playgroundStore.saveToLocalStorage();
                  })}
                />
                <Button onClick={() => setShowingEditModal(false)}>Done</Button>
              </VStack>
            </ModalBody>
            <ModalCloseButton />
          </ModalContent>
        </Modal>
      )}
    </HStack>
  );
});
