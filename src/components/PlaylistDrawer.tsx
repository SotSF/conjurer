import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
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
      size="sm"
      isOpen={playlistDrawerOpen}
      placement="right"
      onClose={action(() => (uiStore.playlistDrawerOpen = false))}
    >
      <DrawerOverlay />
      <DrawerContent bgColor="gray.700">
        <DrawerHeader>Playlist</DrawerHeader>
        <DrawerBody>
          <PlaylistEditor />
        </DrawerBody>
        <DrawerCloseButton />
      </DrawerContent>
    </Drawer>
  );
});
