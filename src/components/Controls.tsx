import { observer } from "mobx-react-lite";
import { HStack, IconButton } from "@chakra-ui/react";
import { RiZoomInLine, RiZoomOutLine } from "react-icons/ri";
import { BiTimer } from "react-icons/bi";
import { FaFolderOpen, FaRegClipboard } from "react-icons/fa";
import { FiSave } from "react-icons/fi";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { TimerControls } from "@/src/components/TimerControls";
import { TimerReadout } from "@/src/components/TimerReadout";
import { AudioControls } from "@/src/components/AudioControls";

export const Controls = observer(function Controls() {
  const store = useStore();
  const { uiStore } = store;

  return (
    <HStack my={2} width="100%" overflowX="clip">
      <TimerReadout />
      <TimerControls />
      <AudioControls />
      {/* <ExperienceTitle /> */}
      <IconButton
        aria-label="Copy to clipboard"
        title="Copy to clipboard"
        height={6}
        icon={<FaRegClipboard size={17} />}
        onClick={() =>
          navigator.clipboard.writeText(JSON.stringify(store.serialize()))
        }
      />
      <IconButton
        aria-label="Save"
        title="Save"
        height={6}
        icon={<FiSave size={17} />}
        onClick={() => store.saveToLocalStorage("arrangement")}
      />
      <IconButton
        aria-label="Open last saved"
        title="Open"
        height={6}
        icon={<FaFolderOpen size={17} />}
        onClick={() => store.loadFromLocalStorage("arrangement")}
      />
      <IconButton
        aria-label="Open last auto saved"
        title="Open last auto saved"
        height={6}
        icon={<BiTimer size={18} />}
        onClick={() => store.loadFromLocalStorage("autosave")}
      />
      <IconButton
        aria-label="Zoom in"
        title="Zoom in"
        height={6}
        icon={<RiZoomInLine size={17} />}
        onClick={action(() => uiStore.zoomIn())}
      />
      <IconButton
        aria-label="Zoom out"
        title="Zoom out"
        height={6}
        icon={<RiZoomOutLine size={17} />}
        onClick={action(() => uiStore.zoomOut())}
      />
      {/* <Popover
        placement="bottom"
        isLazy
        returnFocusOnClose={false}
        openDelay={0}
        closeDelay={0}
      >
        <PopoverTrigger>
          <IconButton
            aria-label="Tempo"
            title="Tempo"
            height={6}
            icon={<FaDrum size={17} />}
          />
        </PopoverTrigger>
        <Portal>
          <PopoverContent>
            <TempoControls />
          </PopoverContent>
        </Portal>
      </Popover> */}
    </HStack>
  );
});
