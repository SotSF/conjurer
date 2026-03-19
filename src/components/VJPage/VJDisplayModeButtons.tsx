import { Tab, TabList, Tabs } from "@chakra-ui/react";
import { memo } from "react";
import { DisplayMode } from "@/src/types/UIStore";
import { action } from "mobx";

const displayModeTabs: DisplayMode[] = [
  "canopy",
  "cartesianSpace",
  "canopySpace",
  "none",
];

type Props = {
  displayMode: DisplayMode;
  onChange: (mode: DisplayMode) => void;
};

export const VJDisplayModeButtons = memo(function VJDisplayModeButtons({
  displayMode,
  onChange,
}: Props) {
  const selectedDisplayModeIndex = displayModeTabs.indexOf(displayMode);
  const setSelectedDisplayModeIndex = action((index: number) => {
    onChange(displayModeTabs[index]);
  });

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

