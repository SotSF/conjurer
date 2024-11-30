import { observer } from "mobx-react-lite";
import {
  Button,
  HStack,
  Heading,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
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
import { DisplayMode } from "@/src/types/UIStore";
import { action } from "mobx";
import { LatencyModal } from "@/src/components/LatencyModal/LatencyModal";
import { ExperienceThumbnail } from "@/src/components/ExperienceThumbnail";
import { ExperienceStatusIndicator } from "../ExperienceStatusIndicator";
import { useRouter } from "next/router";

export const MenuBar = observer(function MenuBar() {
  const store = useStore();
  const { audioStore, experienceStore, uiStore } = store;

  const router = useRouter();
  const { saveExperience } = useSaveExperience();

  const {
    isOpen: isKeyboardShortcutsOpen,
    onOpen: onOpenKeyboardShortcuts,
    onClose: onCloseKeyboardShortcuts,
  } = useDisclosure();

  // Don't show the menu bar if there's no experience loaded yet
  if (!store.experienceName) return null;

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
        isCentered
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
      <LatencyModal />
      <HStack>
        {store.context === "experienceEditor" && store.canEditExperience ? (
          <ExperienceThumbnail
            thumbnailURL={store.experienceThumbnailURL}
            onClick={action(() => (uiStore.capturingThumbnail = true))}
            showCaptureButton
          />
        ) : (
          <ExperienceThumbnail thumbnailURL={store.experienceThumbnailURL} />
        )}
        <Heading
          size="md"
          onClick={() =>
            store.context === "experienceEditor" &&
            uiStore.attemptShowSaveExperienceModal()
          }
          cursor="pointer"
        >
          {store.experienceName}
        </Heading>
        {store.context === "experienceEditor" &&
          !store.hasSaved &&
          !store.experienceId && (
            <Text ml={2} fontSize="sm" color="red.500" userSelect="none">
              not yet saved
            </Text>
          )}
        {store.context === "experienceEditor" && store.hasSaved && (
          <Text fontSize="sm" color="gray.500" userSelect="none">
            {`last saved at ${Intl.DateTimeFormat("en", {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            }).format(store.experienceLastSavedAt)}`}
          </Text>
        )}
        {process.env.NEXT_PUBLIC_NODE_ENV !== "production" && (
          <Button
            variant="ghost"
            size="sm"
            color={store.usingLocalData ? "orange.500" : "green.500"}
            onClick={() => {
              if (
                confirm(
                  "Switching data sources requires reloading the page - are you sure?",
                )
              ) {
                store.toggleUsingLocalData();
                window.location.reload();
              }
            }}
          >
            {store.usingLocalData ? "using local data" : "using prod data"}
          </Button>
        )}
      </HStack>
      <HStack>
        <OpenExperienceModal />
        <SaveExperienceModal />

        {/* Only the experience editor gets the File and Edit menus */}
        {store.context === "experienceEditor" && (
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
                {store.context === "experienceEditor" && (
                  <>
                    <MenuItem
                      icon={<FaFile size={17} />}
                      command="⌘N"
                      onClick={() =>
                        experienceStore.openEmptyExperience(router)
                      }
                    >
                      New experience
                    </MenuItem>
                    <MenuDivider />
                  </>
                )}
                <MenuItem
                  icon={<FaFolderOpen size={17} />}
                  command="⌘O"
                  onClick={uiStore.attemptShowOpenExperienceModal}
                >
                  Open...
                </MenuItem>
                {store.context === "experienceEditor" && (
                  <>
                    <MenuDivider />
                    <MenuItem
                      icon={<FiSave size={17} />}
                      command="⌘S"
                      onClick={() => saveExperience()}
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
                  </>
                )}
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
          </>
        )}

        {/* Experience editor and playlist editor both get View, Tools, and Help menus */}
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
            View
          </MenuButton>
          <MenuList zIndex={12}>
            {store.context === "experienceEditor" && (
              <>
                <MenuOptionGroup
                  defaultValue={uiStore.renderTargetSize.toString()}
                  title="App orientation"
                  type="radio"
                  value={uiStore.horizontalLayout ? "horizontal" : "vertical"}
                  onChange={uiStore.toggleLayout}
                >
                  <MenuItemOption value="horizontal">Horizontal</MenuItemOption>
                  <MenuItemOption value="vertical">Vertical</MenuItemOption>
                </MenuOptionGroup>
                <MenuDivider />
              </>
            )}
            <MenuOptionGroup
              defaultValue={uiStore.renderTargetSize.toString()}
              title="Render size (resolution)"
              type="radio"
              value={uiStore.renderTargetSize.toString()}
              onChange={action(
                (value) =>
                  (uiStore.renderTargetSize = parseInt(value as string)),
              )}
            >
              <MenuItemOption value="256">256 x 256</MenuItemOption>
              <MenuItemOption value="512">512 x 512</MenuItemOption>
              <MenuItemOption value="1024">1024 x 1024</MenuItemOption>
            </MenuOptionGroup>
            <MenuDivider />
            <MenuOptionGroup
              defaultValue={uiStore.displayMode}
              title="Display mode"
              type="radio"
              value={uiStore.displayMode}
              onChange={action(
                (value) => (uiStore.displayMode = value as DisplayMode),
              )}
            >
              <MenuItemOption value="canopy">Canopy</MenuItemOption>
              <MenuItemOption value="cartesianSpace">
                Cartesian space
              </MenuItemOption>
              <MenuItemOption value="canopySpace">Canopy space</MenuItemOption>
            </MenuOptionGroup>
            <MenuDivider />
            <MenuItemOption
              isChecked={uiStore.showingPerformance}
              onClick={uiStore.togglePerformance}
            >
              Show performance overlay
            </MenuItemOption>
          </MenuList>
        </Menu>
        {process.env.NEXT_PUBLIC_NODE_ENV !== "production" && (
          <Menu closeOnSelect={false}>
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
              Tools
            </MenuButton>
            <MenuList zIndex={12}>
              <MenuItemOption
                isChecked={store.sendingData}
                onClick={store.toggleSendingData}
              >
                Transmit data to canopy
              </MenuItemOption>
              <MenuDivider />
              <MenuItem
                onClick={action(() => (uiStore.showingLatencyModal = true))}
              >
                Set audio latency ({(audioStore.audioLatency * 1000).toFixed()}
                ms)
              </MenuItem>
            </MenuList>
          </Menu>
        )}
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
            {store.context === "experienceEditor" && (
              <MenuItem onClick={onOpenKeyboardShortcuts}>
                Keyboard shortcuts
              </MenuItem>
            )}
            <MenuItem
              as="a"
              href="https://github.com/SotSF/conjurer/issues/new/choose"
              target="_blank"
            >
              Report an issue
            </MenuItem>
          </MenuList>
          <Button
            as={Button}
            px={1}
            py={0}
            variant="ghost"
            size="xs"
            fontSize="xs"
            transition="all 0.2s"
            borderRadius="md"
            _hover={{ bg: "gray.500" }}
            _focus={{ boxShadow: "outline" }}
          >
            <ExperienceStatusIndicator
              experienceStatus={store.experienceStatus}
              withLabel
            />
          </Button>
        </Menu>
      </HStack>
    </VStack>
  );
});
