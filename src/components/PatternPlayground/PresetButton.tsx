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
import { FaPencilAlt } from "react-icons/fa";

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
        aria-label="Editing preset name"
        title="Editing preset name"
        borderRadius={0}
        onClick={() => setShowingEditModal(true)}
        icon={<FaPencilAlt size={10} />}
        color="orange.200"
      />
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
        color={confirmingDelete ? "red.500" : "red.200"}
      />
      {showingEditModal && (
        <Modal
          isOpen={showingEditModal}
          onClose={() => setShowingEditModal(false)}
          isCentered
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit preset name</ModalHeader>
            <ModalBody>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  playgroundStore.saveToLocalStorage();
                  setShowingEditModal(false);
                }}
              >
                <VStack>
                  <input
                    type="text"
                    value={preset.name || ""}
                    onChange={action((e) => {
                      preset.name = e.target.value;
                      playgroundStore.saveToLocalStorage();
                    })}
                  />
                  <Button alignSelf="end" type="submit">
                    Done
                  </Button>
                </VStack>
              </form>
            </ModalBody>
            <ModalCloseButton />
          </ModalContent>
        </Modal>
      )}
    </HStack>
  );
});
