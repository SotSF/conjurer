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
  Portal,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { FaFile, FaFolderOpen, FaRegClipboard, FaShareAlt } from "react-icons/fa";
import { FiSave } from "react-icons/fi";
import { RxAlignCenterHorizontally } from "react-icons/rx";
import { TbArrowBigRightLines } from "react-icons/tb";
import { BsSoundwave } from "react-icons/bs";
import { useStore } from "@/src/types/StoreContext";
import { OpenExperienceModal } from "@/src/components/Menu/OpenExperienceModal";
import { SaveExperienceModal } from "@/src/components/Menu/SaveExperienceModal";
import { KeyboardShortcuts } from "@/src/components/KeyboardShortcuts";
import { useSaveExperience } from "@/src/hooks/experience";
import { DisplayMode } from "@/src/types/UIStore";
import { action } from "mobx";
import { LatencyModal } from "@/src/components/LatencyModal/LatencyModal";
import { ExperienceThumbnail } from "@/src/components/ExperienceThumbnail";
import { ExperienceStatusToggle } from "@/src/components/ExperienceStatusToggle";
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
    <VStack alignItems="flex-start" spacing={1}>
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
        {store.experienceUser && (
          <Text ml={2} fontSize="sm" userSelect="none">
            by {store.experienceUser.username}
          </Text>
        )}
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
              <Portal>
                <MenuList zIndex="dropdown">
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
                        isDisabled={!store.canEditExperience}
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
              </Portal>
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
              <Portal>
                <MenuList zIndex="dropdown">
                  <MenuItem
                    icon={<FaRegClipboard size={17} />}
                    onClick={experienceStore.copyToClipboard}
                  >
                    Copy experience JSON to clipboard
                  </MenuItem>
                  <MenuItem
                    icon={<FaShareAlt size={17} />}
                    onClick={store.copyLinkToExperience}
                  >
                    Copy link to experience
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          </>
        )}

        {/* Experience editor and playlist editor both get View, Tools, Navigate, and Help menus */}
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
            View
          </MenuButton>
          <Portal>
            <MenuList zIndex="dropdown">
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
              {store.context === "experienceEditor" && (
                <>
                  <MenuDivider />
                  <MenuItemOption
                    icon={<BsSoundwave size={17} />}
                    isChecked={uiStore.showingWaveformOverlay}
                    onClick={uiStore.toggleWaveformOverlay}
                  >
                    Show audio waveform overlay
                  </MenuItemOption>
                  <MenuItemOption
                    icon={<RxAlignCenterHorizontally size={17} />}
                    isChecked={uiStore.keepingPlayHeadCentered}
                    onClick={action(() => {
                      uiStore.keepingPlayHeadCentered =
                        !uiStore.keepingPlayHeadCentered;
                    })}
                  >
                    Keep playhead centered
                  </MenuItemOption>
                  <MenuItemOption
                    icon={<TbArrowBigRightLines size={17} />}
                    isChecked={uiStore.keepingPlayHeadVisible}
                    onClick={action(() => {
                      uiStore.keepingPlayHeadVisible =
                        !uiStore.keepingPlayHeadVisible;
                    })}
                  >
                    Keep playhead visible
                  </MenuItemOption>
                </>
              )}
            </MenuList>
          </Portal>
        </Menu>
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
          <Portal>
            <MenuList zIndex="dropdown">
              <MenuItemOption
                isChecked={store.sendingData}
                onClick={store.toggleSendingData}
                isDisabled={
                  process.env.NEXT_PUBLIC_NODE_ENV === "production"
                }
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
          </Portal>
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
            Navigate
          </MenuButton>
          <Portal>
            <MenuList zIndex="dropdown">
              <MenuItem as="a" href="/playground" target="_blank">
                Playground
              </MenuItem>
              <MenuItem as="a" href="/admin" target="_blank">
                Admin
              </MenuItem>
            </MenuList>
          </Portal>
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
          <Portal>
            <MenuList zIndex="dropdown">
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
              <MenuItem as="a" href="/laws-of-conjury" target="_blank">
                Laws of Conjury
              </MenuItem>
              <MenuItem
                as="a"
                href="https://github.com/SotSF/conjurer/issues/new/choose"
                target="_blank"
              >
                Report an issue
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
        <ExperienceStatusToggle
          experienceId={store.experienceId}
          experienceUserId={store.experienceUser?.id ?? -1}
          status={store.experienceStatus}
          withLabel
        />
      </HStack>
    </VStack>
  );
});
