import { Grid, GridItem } from "@chakra-ui/react";
import { Timeline } from "@/src/components/Timeline/Timeline";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { ExperienceEditorControls } from "@/src/components/ExperienceEditor/ExperienceEditorControls";
import { BlockDevicePanel } from "@/src/components/ExperienceEditor/BlockDevicePanel";
import { StatusInfoBar } from "@/src/components/ExperienceEditor/StatusInfoBar";

export const Arrangement = observer(function Arrangement() {
  const store = useStore();

  const showDevicePanel =
    store.context !== "viewer" && store.uiStore.showDevicePanel;
  // device + status rows are auto-height; the timeline shrinks to make room
  return (
    <Grid
      width="100%"
      height="100%"
      templateAreas={`"controls"
                      "timeline"
                      "device"
                      "status"`}
      gridTemplateColumns="minmax(0,1fr)"
      gridTemplateRows="auto minmax(0,1fr) auto auto"
      onMouseLeave={action(() => store.uiStore.clearAllHoverHelp())}
    >
      <GridItem area="controls">
        {store.context !== "viewer" && <ExperienceEditorControls />}
      </GridItem>
      <GridItem area="timeline" bgColor="gray.400">
        <Timeline />
      </GridItem>
      <GridItem area="device">{showDevicePanel && <BlockDevicePanel />}</GridItem>
      <GridItem area="status">
        <StatusInfoBar />
      </GridItem>
    </Grid>
  );
});
