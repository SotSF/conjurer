import { FaDotCircle } from "react-icons/fa";
import { TbRectangleFilled } from "react-icons/tb";
import { Tab, TabList, Tabs } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { DisplayMode } from "@/src/types/UIStore";
import { action } from "mobx";

const displayModeTabs: DisplayMode[] = [
  "canopy",
  "canopySpace",
  "cartesianSpace",
];

export const DisplayModeButtons = observer(function DisplayModeButtons() {
  const store = useStore();
  const { uiStore } = store;

  const selectedDisplayModeIndex = displayModeTabs.indexOf(uiStore.displayMode);
  const setSelectedDisplayModeIndex = action((index: number) => {
    uiStore.displayMode = displayModeTabs[index];
  });

  return (
    <Tabs
      flexGrow={1}
      mt={2}
      mx={2}
      variant="line"
      index={selectedDisplayModeIndex}
      onChange={setSelectedDisplayModeIndex}
    >
      <TabList>
        <Tab>
          <FaDotCircle size={17} />
          &nbsp;Canopy
        </Tab>
        <Tab>
          <TbRectangleFilled size={17} />
          &nbsp;Canopy space
        </Tab>
        <Tab>
          <TbRectangleFilled size={17} />
          &nbsp;Cartesian space
        </Tab>
      </TabList>
    </Tabs>
  );
});
