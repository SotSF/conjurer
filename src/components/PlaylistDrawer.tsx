import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { action } from "mobx";
import { PlaylistEditor } from "@/src/components/PlaylistEditor/PlaylistEditor";

export const PlaylistDrawer = observer(function PlaylistDrawer() {
  const store = useStore();
  const { uiStore } = store;
  const { playlistDrawerOpen } = uiStore;

  return (
    <Drawer
      size="md"
      isOpen={playlistDrawerOpen}
      placement="right"
      onClose={action(() => (uiStore.playlistDrawerOpen = false))}
      autoFocus={false}
    >
      <DrawerOverlay />
      <DrawerContent bgColor="gray.700">
        <DrawerCloseButton />
        <DrawerBody>
          <PlaylistEditor />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
});
