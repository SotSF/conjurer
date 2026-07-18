import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { action } from "mobx";
import Link from "next/link";
import { FiExternalLink } from "react-icons/fi";
import { LawsOfConjuryContent } from "@/src/components/Menu/LawsOfConjuryContent";

export const LawsOfConjuryDrawer = observer(function LawsOfConjuryDrawer() {
  const store = useStore();
  const { uiStore } = store;

  const isOpen = uiStore.showingLawsOfConjuryDrawer;
  const onClose = action(() => (uiStore.showingLawsOfConjuryDrawer = false));

  return (
    <Drawer size="full" isOpen={isOpen} placement="left" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent bgColor="gray.700">
        <DrawerHeader>
          <HStack spacing={2}>
            <span>✨ Laws of Conjury ✨</span>
            <IconButton
              as={Link}
              href="/laws-of-conjury"
              target="_blank"
              aria-label="Open dedicated page"
              icon={<FiExternalLink />}
              size="xs"
              variant="ghost"
            />
          </HStack>
        </DrawerHeader>
        <DrawerBody>
          <LawsOfConjuryContent />
        </DrawerBody>
        <DrawerCloseButton />
      </DrawerContent>
    </Drawer>
  );
});
