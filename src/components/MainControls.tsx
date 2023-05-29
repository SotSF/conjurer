import { observer } from "mobx-react-lite";
import { HStack, IconButton } from "@chakra-ui/react";
import { RiZoomInLine, RiZoomOutLine } from "react-icons/ri";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { AudioControls } from "@/src/components/AudioControls";

export const MainControls = observer(function MainControls() {
  const store = useStore();
  const { uiStore } = store;

  return (
    <HStack height={10} py={2} spacing={1} overflowX="clip" borderColor="black">
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
