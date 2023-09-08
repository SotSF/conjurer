import { Arrangement } from "@/src/components/Arrangement";
import { Box, Grid, GridItem } from "@chakra-ui/react";
import { Display } from "@/src/components/Display";
import { useEffect, useRef } from "react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { KeyboardControls } from "@/src/components/KeyboardControls";
import { PlaylistDrawer } from "@/src/components/PlaylistDrawer";

export const ViewerPage = observer(function ViewerPage() {
  const store = useStore();
  const didInitialize = useRef(false);
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    store.initializeClientSide();
  }, [store]);

  return (
    <Box position="relative" w="100vw" h="100vh">
      <KeyboardControls />
      <PlaylistDrawer />
      <Grid
        templateAreas={`"display"
                        "arrangement"`}
        gridTemplateColumns="100vw"
        gridTemplateRows="minmax(0,1fr) auto"
        height="100vh"
      >
        <GridItem area="display">
          <Display />
        </GridItem>
        <GridItem area="arrangement">
          <Arrangement />
        </GridItem>
      </Grid>
    </Box>
  );
});
