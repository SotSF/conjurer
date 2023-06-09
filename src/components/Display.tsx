import styles from "@/styles/Display.module.css";
import { Box, Heading, VStack } from "@chakra-ui/react";
import { DisplayCanvas } from "@/src/components/DisplayCanvas";
import { DisplayControls } from "@/src/components/DisplayControls";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { UserPicker } from "@/src/components/UserPicker";
import { MenuBar } from "@/src/components/Menu/MenuBar";

export const Display = observer(function Display() {
  const { uiStore } = useStore();

  return (
    <Box
      // trigger a re-instantiation of the canvas when the layout changes
      key={`canopy-${uiStore.horizontalLayout ? "horizontal" : "vertical"}`}
      resize={uiStore.horizontalLayout ? "vertical" : undefined}
      overflow="auto"
      position="relative"
      height={uiStore.horizontalLayout ? "40vh" : "100vh"}
    >
      <MenuBar />
      <VStack position="absolute" width="100%" marginY="2" zIndex={1}>
        <Heading className={styles.fadeOut} userSelect="none">
          Conjurer
        </Heading>
      </VStack>
      <VStack p={2} position="absolute" top={0} right={0} zIndex={1}>
        <UserPicker />
      </VStack>
      <DisplayControls />
      <Box height="100%" bgColor="gray.900">
        <DisplayCanvas />
      </Box>
    </Box>
  );
});
