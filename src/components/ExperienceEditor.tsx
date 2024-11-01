import { Arrangement } from "@/src/components/Arrangement";
import { Box, Grid, GridItem } from "@chakra-ui/react";
import { Display } from "@/src/components/Display";
import { useEffect } from "react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { KeyboardControls } from "@/src/components/KeyboardControls";
import { AddPatternButton } from "@/src/components/AddPatternButton";
import { PlaylistDrawer } from "@/src/components/PlaylistDrawer";
import { PatternDrawer } from "@/src/components/PatternDrawer";
import { useRouter } from "next/router";

export const ExperienceEditor = observer(function ExperienceEditor() {
  const store = useStore();
  const { uiStore, experienceStore } = store;

  const router = useRouter();
  useEffect(() => {
    if (store.initializedClientSide || !router.query.experienceName) return;
    store.initializeClientSide(router.query.experienceName as string);
  }, [store, experienceStore, store.experienceName, router.query.experienceName]);

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
