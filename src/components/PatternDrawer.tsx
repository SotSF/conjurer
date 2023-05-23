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
import { PatternList } from "@/src/components/PatternList";
import { action } from "mobx";

export const PatternDrawer = observer(function PatternDrawer() {
  const store = useStore();
  const { uiStore } = store;
  const { patternDrawerOpen } = uiStore;

  return (
    <Drawer
      size="md"
      isOpen={patternDrawerOpen}
      placement="left"
      onClose={action(() => {
        uiStore.patternDrawerOpen = false;
      })}
    >
      <DrawerOverlay />
      <DrawerContent bgColor="gray.600">
        <DrawerCloseButton />
        <DrawerHeader>Pattern List</DrawerHeader>

        <DrawerBody>
          <PatternList />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
});
