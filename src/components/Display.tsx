import styles from "@/styles/Display.module.css";
import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { DisplayCanvas } from "@/src/components/Canvas/DisplayCanvas";
import { DisplayControls } from "@/src/components/DisplayControls";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { LoginModal } from "@/src/components/LoginModal";
import { MenuBar } from "@/src/components/Menu/MenuBar";
import { useRef, useState } from "react";

export const Display = observer(function Display() {
  const store = useStore();
  const { uiStore, embeddedViewer } = store;

  const boxRef = useRef<HTMLDivElement>(null);

  const [showAllControls, setShowAllControls] = useState(true);

  return (
    <Box
      // trigger a re-instantiation of the canvas when the layout changes
      key={`canopy-${uiStore.horizontalLayout ? "horizontal" : "vertical"}`}
      overflow="auto"
      position="relative"
      height="100%"
      onDoubleClick={() => {
        // TODO: hide controls some other way than double click
        // setShowAllControls(!showAllControls);
      }}
    >
      {!embeddedViewer && (
        <Box opacity={showAllControls ? 1 : 0} transition="all 100ms">
          <MenuBar />
          <VStack position="absolute" width="100%" marginY="2" zIndex={1}>
            <Heading className={styles.fadeOut} userSelect="none">
              Conjurer
            </Heading>
          </VStack>
          <VStack p={2} position="absolute" top={0} right={0} zIndex={1}>
            {store.context === "viewer" ? (
              <Text fontWeight={"bold"}>by {store.username}</Text>
            ) : (
              <LoginModal />
            )}
          </VStack>
          <DisplayControls canvasContainer={boxRef.current} />
        </Box>
      )}

      <Box ref={boxRef} height="100%" bgColor="gray.900">
        <DisplayCanvas />
      </Box>
    </Box>
  );
});
