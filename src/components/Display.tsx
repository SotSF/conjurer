import styles from "@/styles/Display.module.css";
import { Box, Heading, HStack } from "@chakra-ui/react";
import { DisplayCanvas } from "@/src/components/Canvas/DisplayCanvas";
import { DisplayControls } from "@/src/components/DisplayControls";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { MenuBar } from "@/src/components/Menu/MenuBar";
import { useState } from "react";
import { LoginButton } from "@/src/components/LoginButton";
import { RoleSelector } from "@/src/components/RoleSelector";
import { ExperienceHeading } from "@/src/components/Menu/ExperienceHeading";
import { EmceeOutputControlsToggle } from "@/src/components/PlaylistEditor/EmceeOutputControlsToggle";

export const Display = observer(function Display() {
  const store = useStore();
  const { uiStore, viewerMode } = store;

  const [containerElement, setContainerElement] =
    useState<HTMLDivElement | null>(null);

  return (
    <Box
      // trigger a re-instantiation of the canvas when the layout changes
      key={`canopy-${uiStore.horizontalLayout ? "horizontal" : "vertical"}`}
      overflow="auto"
      position="relative"
      height="100%"
    >
      <Box transition="all 100ms">
        {viewerMode && <ExperienceHeading />}
        {!viewerMode && (
          <>
            <MenuBar />
            <Heading
              className={styles.fadeOut}
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              zIndex={1}
              pointerEvents="none"
              userSelect="none"
            >
              Conjurer
            </Heading>
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
          </>
        )}
        <DisplayControls canvasContainer={containerElement} />
        {store.context === "playlistEditor" && <EmceeOutputControlsToggle />}
      </Box>

      <Box
        ref={(element) => setContainerElement(element)}
        height="100%"
        bgColor="gray.900"
      >
        <DisplayCanvas />
      </Box>
    </Box>
  );
});
