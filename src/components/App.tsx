import { Arrangement } from "@/src/components/Arrangement";
import { Box, Grid, GridItem } from "@chakra-ui/react";
import { Display } from "@/src/components/Display";
import { useEffect, useRef } from "react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { KeyboardControls } from "@/src/components/KeyboardControls";
import { AddPatternButton } from "@/src/components/AddPatternButton";
import { PlaylistDrawer } from "@/src/components/PlaylistDrawer";
import { PatternDrawer } from "@/src/components/PatternDrawer";

export const App = observer(function App() {
  const store = useStore();
  const { uiStore } = store;
  const didInitialize = useRef(false);
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    store.initializeClientSide();
  }, [store]);

  const gridItems = (
    <>
      <GridItem area="display">
        <Display />
      </GridItem>
      <GridItem area="arrangement">
        <Arrangement />
      </GridItem>
    </>
  );

  return (
    <Box position="relative" w="100vw" h="100vh">
      <KeyboardControls editMode />
      <PatternDrawer />
      <PlaylistDrawer />
      {uiStore.horizontalLayout ? (
        <Grid
          templateAreas={`"display"
                        "arrangement"`}
          gridTemplateColumns="100vw"
          gridTemplateRows="40vh minmax(0,1fr)"
          height="100vh"
        >
          {gridItems}
        </Grid>
      ) : (
        <Grid
          templateAreas={`"arrangement display"`}
          gridTemplateColumns="60vw 40vw"
          gridTemplateRows="100vh"
          height="100vh"
        >
          {gridItems}
        </Grid>
      )}
      <AddPatternButton />
    </Box>
  );
});
