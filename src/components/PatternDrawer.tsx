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
import { PatternPlayground } from "@/src/components/PatternPlayground/PatternPlayground";

export const PatternDrawer = observer(function PatternDrawer() {
  const store = useStore();
  const { uiStore } = store;
  const { patternDrawerOpen } = uiStore;

  return (
    <Drawer
      size="full"
      isOpen={patternDrawerOpen}
      placement="left"
      onClose={action(() => {
        uiStore.patternDrawerOpen = false;
      })}
    >
      <DrawerOverlay />
      <DrawerContent bgColor="gray.600">
        <DrawerCloseButton />
        <DrawerHeader>Pattern Playground</DrawerHeader>

        <DrawerBody>
          <PatternPlayground />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
});
