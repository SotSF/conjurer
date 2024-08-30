import { Arrangement } from "@/src/components/Arrangement";
import { Box, Grid, GridItem } from "@chakra-ui/react";
import { Display } from "@/src/components/Display";
import { lazy, memo, useEffect, useRef } from "react";
import { useStore } from "@/src/types/StoreContext";
import { KeyboardControls } from "@/src/components/KeyboardControls";
import { PlaylistDrawer } from "@/src/components/PlaylistDrawer";
import { ExperienceLoader } from "@/src/components/ExperienceLoader";

const PortalNarrativeModal = lazy(
  () => import("@/src/components/PortalNarrativeModal")
);

type Props = {
  portalNarrative?: boolean;
};

export const ViewerPage = memo(function ViewerPage({
  portalNarrative = false,
}: Props) {
  const store = useStore();
  const didInitialize = useRef(false);
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    store.initializeClientSide();
  }, [store]);

  return (
    <Box position="relative" w="100vw" h="100vh">
      <ExperienceLoader />
      <KeyboardControls editMode={false} />
      <PlaylistDrawer />
      {portalNarrative && <PortalNarrativeModal />}
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
