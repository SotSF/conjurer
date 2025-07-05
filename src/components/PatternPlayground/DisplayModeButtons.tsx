import { Tab, TabList, Tabs } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { DisplayMode } from "@/src/types/UIStore";
import { action } from "mobx";

const displayModeTabs: DisplayMode[] = [
  "canopy",
  "cartesianSpace",
  "canopySpace",
  "none",
];

export const DisplayModeButtons = observer(function DisplayModeButtons() {
  const store = useStore();
  const { uiStore } = store;

  const selectedDisplayModeIndex = displayModeTabs.indexOf(
    uiStore.playgroundDisplayMode,
  );
  const setSelectedDisplayModeIndex = action(
    (index: number) => (uiStore.playgroundDisplayMode = displayModeTabs[index]),
  );

  return (
    <Tabs
      size="sm"
      mt={2}
      mx={2}
      variant="line"
      index={selectedDisplayModeIndex}
      onChange={setSelectedDisplayModeIndex}
    >
      <TabList>
        <Tab>Canopy</Tab>
        <Tab>Cartesian space</Tab>
        <Tab>Canopy space</Tab>
        <Tab>X</Tab>
      </TabList>
    </Tabs>
  );
});
