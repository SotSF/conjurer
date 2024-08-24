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
import Link from "next/link";

const PatternDrawer = observer(function PatternDrawer() {
  const store = useStore();
  const { uiStore } = store;
  const { patternDrawerOpen } = uiStore;

  return (
    <Drawer
      size="full"
      isOpen={patternDrawerOpen}
      placement="left"
      onClose={action(() => (uiStore.patternDrawerOpen = false))}
    >
      <DrawerOverlay />
      <DrawerContent bgColor="gray.700">
        <DrawerHeader>
          <Link href="/playground" target="_blank">
            Pattern Playground
          </Link>
        </DrawerHeader>
        <DrawerBody>
          <PatternPlayground />
        </DrawerBody>
        <DrawerCloseButton />
      </DrawerContent>
    </Drawer>
  );
});

export default PatternDrawer;
