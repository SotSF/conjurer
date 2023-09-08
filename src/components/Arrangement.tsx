import { Grid, GridItem } from "@chakra-ui/react";
import { MainControls } from "@/src/components/MainControls";
import { Timeline } from "@/src/components/Timeline";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";

export const Arrangement = observer(function Arrangement() {
  const store = useStore();

  return (
    <Grid
      width="100%"
      height="100%"
      templateAreas={`"controls"
                      "timeline"`}
      gridTemplateColumns="minmax(0,1fr)"
      gridTemplateRows="auto minmax(0,1fr)"
    >
      <GridItem area="controls">
        {store.context !== "viewer" && <MainControls />}
      </GridItem>
      <GridItem area="timeline" bgColor="gray.400">
        <Timeline />
      </GridItem>
    </Grid>
  );
});
