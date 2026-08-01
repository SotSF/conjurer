import { Grid, GridItem } from "@chakra-ui/react";
import { Timeline } from "@/src/components/Timeline/Timeline";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { ExperienceEditorControls } from "@/src/components/ExperienceEditor/ExperienceEditorControls";
import { BlockDevicePanel } from "@/src/components/ExperienceEditor/BlockDevicePanel";
import { ParameterDetailPanel } from "@/src/components/ExperienceEditor/ParameterDetailPanel";
import { StatusInfoBar } from "@/src/components/ExperienceEditor/StatusInfoBar";
import { nonSelectableUiProps } from "@/src/utils/nonSelectableUi";

export const Arrangement = observer(function Arrangement() {
  const store = useStore();

  const showDetailPanel =
    store.context !== "viewer" &&
    store.uiStore.showParameterDetailPanel &&
    store.selectedParameter != null;
  const showDevicePanel =
    store.context !== "viewer" &&
    store.uiStore.showDevicePanel &&
    !showDetailPanel;
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
      {...nonSelectableUiProps}
    >
      <GridItem area="controls">
        {store.context !== "viewer" && <ExperienceEditorControls />}
      </GridItem>
      <GridItem area="timeline" bgColor="gray.400">
        <Timeline />
      </GridItem>
      <GridItem area="device">
        {showDetailPanel ? (
          <ParameterDetailPanel />
        ) : (
          showDevicePanel && <BlockDevicePanel />
        )}
      </GridItem>
      <GridItem area="status">
        <StatusInfoBar />
      </GridItem>
    </Grid>
  );
});
