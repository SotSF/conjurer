import { Grid, GridItem } from "@chakra-ui/react";
import { Timeline } from "@/src/components/Timeline/Timeline";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { ExperienceEditorControls } from "@/src/components/ExperienceEditor/ExperienceEditorControls";
import { BlockDevicePanel } from "@/src/components/ExperienceEditor/BlockDevicePanel";

export const Arrangement = observer(function Arrangement() {
  const store = useStore();

  const showDevicePanel =
    store.context !== "viewer" && store.uiStore.showDevicePanel;
  return (
    <Grid
      width="100%"
      height="100%"
      templateAreas={`"controls"
                      "timeline"
                      "device"`}
      gridTemplateColumns="minmax(0,1fr)"
      // the device row is auto-height, so it takes space only when a block is
      // selected (the panel renders null otherwise); the timeline shrinks to
      // make room rather than growing
      gridTemplateRows="auto minmax(0,1fr) auto"
    >
      <GridItem area="controls">
        {store.context !== "viewer" && <ExperienceEditorControls />}
      </GridItem>
      <GridItem area="timeline" bgColor="gray.400">
        <Timeline />
      </GridItem>
      <GridItem area="device">{showDevicePanel && <BlockDevicePanel />}</GridItem>
    </Grid>
  );
});
