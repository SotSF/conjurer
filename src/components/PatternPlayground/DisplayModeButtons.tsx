import { Box } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { DisplayMode } from "@/src/types/UIStore";
import { action } from "mobx";
import { ConnectedButtonGroup } from "@/src/components/ConnectedButtonGroup";

const displayModeOptions = [
  { value: "canopy" as const, label: "Canopy" },
  { value: "cartesianSpace" as const, label: "Cartesian space" },
  { value: "canopySpace" as const, label: "Canopy space" },
  { value: "none" as const, label: "X" },
] as const;

export const DisplayModeButtons = observer(function DisplayModeButtons() {
  const store = useStore();
  const { uiStore } = store;

  return (
    <Box mt={2} mx={2}>
      <ConnectedButtonGroup<DisplayMode>
        options={displayModeOptions}
        value={uiStore.playgroundDisplayMode}
        onChange={action((mode: DisplayMode) => {
          uiStore.playgroundDisplayMode = mode;
        })}
        size="sm"
        aria-label="Display mode"
      />
    </Box>
  );
});
