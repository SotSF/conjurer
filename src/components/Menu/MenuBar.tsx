import { observer } from "mobx-react-lite";
import {
  Button,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import { BiTimer } from "react-icons/bi";
import { FaFolderOpen, FaRegClipboard } from "react-icons/fa";
import { FiSave } from "react-icons/fi";
import { useStore } from "@/src/types/StoreContext";
import { RxCaretDown } from "react-icons/rx";
import { OpenExperienceModal } from "@/src/components/Menu/OpenExperienceModal";
import { SaveExperienceModal } from "@/src/components/Menu/SaveExperienceModal";
import { action } from "mobx";

export const MenuBar = observer(function MenuBar() {
  const store = useStore();
  const { experienceStore, uiStore } = store;

  return (
    <>
      <OpenExperienceModal />
      <SaveExperienceModal />
      <Menu>
        <MenuButton
          as={Button}
          variant="ghost"
          rightIcon={<RxCaretDown size={20} />}
          transition="all 0.2s"
          borderRadius="md"
          _hover={{ bg: "gray.500" }}
          _expanded={{ bg: "blue.400" }}
          _focus={{ boxShadow: "outline" }}
        >
          File
        </MenuButton>
        <MenuList zIndex={12}>
          {/* <MenuItem
            command="⌘N"
            onClick={() => {
              // TODO:
            }}
          >
            New experience
          </MenuItem>
          <MenuDivider /> */}
          <MenuItem
            icon={<FaFolderOpen size={17} />}
            command="⌘O"
            onClick={action(() => {
              uiStore.showingOpenExperienceModal = true;
            })}
          >
            Open...
          </MenuItem>
          <MenuItem
            icon={<FaFolderOpen size={17} />}
            onClick={() => experienceStore.loadFromLocalStorage("experience")}
          >
            Open last locally saved
          </MenuItem>
          <MenuItem
            icon={<BiTimer size={18} />}
            onClick={() => experienceStore.loadFromLocalStorage("autosave")}
          >
            Open last autosaved
          </MenuItem>
          <MenuDivider />
          <MenuItem
            icon={<FiSave size={17} />}
            command="⌘S"
            onClick={experienceStore.saveToS3}
          >
            Save
          </MenuItem>
          <MenuItem
            icon={<FiSave size={17} />}
            command="⌘⇧S"
            onClick={action(() => {
              uiStore.showingSaveExperienceModal = true;
            })}
          >
            Save as...
          </MenuItem>
          <MenuItem
            icon={<FiSave size={17} />}
            onClick={() => experienceStore.saveToLocalStorage("experience")}
          >
            Save locally
          </MenuItem>
          <MenuItem
            icon={<FaRegClipboard size={17} />}
            onClick={experienceStore.copyToClipboard}
          >
            Save to clipboard
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  );
});
