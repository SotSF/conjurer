import { observer } from "mobx-react-lite";
import {
  Button,
  HStack,
  Heading,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { FaFile, FaFolderOpen, FaRegClipboard } from "react-icons/fa";
import { FiSave } from "react-icons/fi";
import { useStore } from "@/src/types/StoreContext";
import { OpenExperienceModal } from "@/src/components/Menu/OpenExperienceModal";
import { SaveExperienceModal } from "@/src/components/Menu/SaveExperienceModal";
import { KeyboardShortcuts } from "@/src/components/KeyboardShortcuts";
import { useSaveExperience } from "@/src/hooks/experience";

export const MenuBar = observer(function MenuBar() {
  const store = useStore();
  const { experienceStore, uiStore } = store;

  const { saveExperience } = useSaveExperience();

  const {
    isOpen: isKeyboardShortcutsOpen,
    onOpen: onOpenKeyboardShortcuts,
    onClose: onCloseKeyboardShortcuts,
  } = useDisclosure();

  return (
    <VStack
      p={2}
      position="absolute"
      top={0}
      left={0}
      alignItems="flex-start"
      zIndex={2}
      spacing={1}
      mx={2}
    >
      <Modal
        isOpen={isKeyboardShortcutsOpen}
        onClose={onCloseKeyboardShortcuts}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Keyboard shortcuts</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <KeyboardShortcuts />
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={onCloseKeyboardShortcuts}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <HStack>
        <Heading
          size="md"
          onClick={() =>
            store.context !== "viewer" &&
            uiStore.attemptShowSaveExperienceModal()
          }
          cursor="pointer"
        >
          {store.experienceName}
        </Heading>
        {store.context !== "viewer" && store.hasSaved && (
          <Text fontSize="sm" color="gray.500" userSelect="none">
            {store.experienceLastSavedAt
              ? `last saved at ${Intl.DateTimeFormat("en", {
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                }).format(store.experienceLastSavedAt)}`
              : "not yet saved"}
          </Text>
        )}
        {process.env.NODE_ENV !== "production" && (
          <Button
            variant="ghost"
            size="sm"
            color={store.usingLocalData ? "orange.500" : "green.500"}
            onClick={store.toggleUsingLocalData}
          >
            {store.usingLocalData ? "using local data" : "using prod data"}
          </Button>
        )}
      </HStack>
      <HStack>
        <OpenExperienceModal />
        <SaveExperienceModal />
        {store.context !== "viewer" && (
          <>
            <Menu>
              <MenuButton
                as={Button}
                px={1}
                py={0}
                variant="ghost"
                size="sm"
                transition="all 0.2s"
                borderRadius="md"
                _hover={{ bg: "gray.500" }}
                _focus={{ boxShadow: "outline" }}
              >
                File
              </MenuButton>
              <MenuList zIndex={12}>
                <MenuItem
                  icon={<FaFile size={17} />}
                  command="⌘N"
                  onClick={store.newExperience}
                >
                  New experience
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  icon={<FaFolderOpen size={17} />}
                  command="⌘O"
                  onClick={uiStore.attemptShowOpenExperienceModal}
                >
                  Open...
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  icon={<FiSave size={17} />}
                  command="⌘S"
                  onClick={saveExperience}
                >
                  Save
                </MenuItem>
                <MenuItem
                  icon={<FiSave size={17} />}
                  command="⌘⇧S"
                  onClick={uiStore.attemptShowSaveExperienceModal}
                >
                  Save as...
                </MenuItem>
              </MenuList>
            </Menu>
            <Menu>
              <MenuButton
                as={Button}
                px={1}
                py={0}
                variant="ghost"
                size="sm"
                transition="all 0.2s"
                borderRadius="md"
                _hover={{ bg: "gray.500" }}
                _focus={{ boxShadow: "outline" }}
              >
                Edit
              </MenuButton>
              <MenuList zIndex={12}>
                <MenuItem
                  icon={<FaRegClipboard size={17} />}
                  onClick={experienceStore.copyToClipboard}
                >
                  Copy experience JSON to clipboard
                </MenuItem>
              </MenuList>
            </Menu>
            <Menu>
              <MenuButton
                as={Button}
                px={1}
                py={0}
                variant="ghost"
                size="sm"
                transition="all 0.2s"
                borderRadius="md"
                _hover={{ bg: "gray.500" }}
                _focus={{ boxShadow: "outline" }}
              >
                Go to
              </MenuButton>
              <MenuList zIndex={12}>
                <MenuItem as="a" href="/playground" target="_blank">
                  Playground
                </MenuItem>
                <MenuItem as="a" href="/controller" target="_blank">
                  Controller
                </MenuItem>
                <MenuItem as="a" href="/portal" target="_blank">
                  Portal
                </MenuItem>
                <MenuItem as="a" href="/beatMapper" target="_blank">
                  Beat Mapper
                </MenuItem>
              </MenuList>
            </Menu>
            <Menu>
              <MenuButton
                as={Button}
                px={1}
                py={0}
                variant="ghost"
                size="sm"
                transition="all 0.2s"
                borderRadius="md"
                _hover={{ bg: "gray.500" }}
                _focus={{ boxShadow: "outline" }}
              >
                Help
              </MenuButton>
              <MenuList zIndex={12}>
                <MenuItem
                  as="a"
                  href="https://github.com/SotSF/conjurer#conjurer"
                  target="_blank"
                >
                  About Conjurer
                </MenuItem>
                <MenuItem onClick={onOpenKeyboardShortcuts}>
                  Keyboard shortcuts
                </MenuItem>
                <MenuItem
                  as="a"
                  href="https://github.com/SotSF/conjurer/issues/new/choose"
                  target="_blank"
                >
                  Report an issue
                </MenuItem>
              </MenuList>
            </Menu>
          </>
        )}
      </HStack>
    </VStack>
  );
});
