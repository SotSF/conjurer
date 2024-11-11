import styles from "@/styles/Display.module.css";
import { Box, Heading, HStack, VStack } from "@chakra-ui/react";
import { DisplayCanvas } from "@/src/components/Canvas/DisplayCanvas";
import { DisplayControls } from "@/src/components/DisplayControls";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { MenuBar } from "@/src/components/Menu/MenuBar";
import { useRef } from "react";
import { LoginButton } from "@/src/components/LoginButton";
import { RoleSelector } from "@/src/components/RoleSelector";

export const Display = observer(function Display() {
  const store = useStore();
  const { uiStore, viewerMode } = store;

  const boxRef = useRef<HTMLDivElement>(null);

  return (
    <Box
      // trigger a re-instantiation of the canvas when the layout changes
      key={`canopy-${uiStore.horizontalLayout ? "horizontal" : "vertical"}`}
      overflow="auto"
      position="relative"
      height="100%"
    >
      {!viewerMode && (
        <Box transition="all 100ms">
          <MenuBar />
          <VStack position="absolute" width="100%" marginY="2" zIndex={1}>
            <Heading className={styles.fadeOut} userSelect="none">
              Conjurer
            </Heading>
          </VStack>
          <HStack
            p={2}
            position="absolute"
            top={0}
            right={0}
            zIndex={1}
            alignItems="end"
          >
            <RoleSelector />
            <LoginButton />
          </HStack>
          <DisplayControls canvasContainer={boxRef.current} />
        </Box>
      )}

      <Box ref={boxRef} height="100%" bgColor="gray.900">
        <DisplayCanvas />
      </Box>
    </Box>
  );
});
