import { observer } from "mobx-react-lite";
import { HStack, IconButton } from "@chakra-ui/react";
import { RiZoomInLine, RiZoomOutLine } from "react-icons/ri";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { TimerControls } from "@/src/components/TimerControls";
import { TimerReadout } from "@/src/components/TimerReadout";
import { AudioControls } from "@/src/components/AudioControls";
import { MenuBar } from "@/src/components/Menu/MenuBar";

export const Controls = observer(function Controls() {
  const { uiStore } = useStore();

  return (
    <HStack my={2} width="100%" overflowX="clip">
      <MenuBar />
      <TimerReadout />
      <TimerControls />
      <AudioControls />
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
    </HStack>
  );
});
