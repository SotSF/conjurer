import { Box } from "@chakra-ui/react";
import { memo } from "react";
import { DisplayMode } from "@/src/types/UIStore";
import { ConnectedButtonGroup } from "@/src/components/ConnectedButtonGroup";

const displayModeOptions = [
  { value: "canopy" as const, label: "Canopy" },
  { value: "cartesianSpace" as const, label: "Cartesian space" },
  { value: "canopySpace" as const, label: "Canopy space" },
  { value: "none" as const, label: "X" },
] as const;

type Props = {
  displayMode: DisplayMode;
  onChange: (mode: DisplayMode) => void;
};

export const VJDisplayModeButtons = memo(function VJDisplayModeButtons({
  displayMode,
  onChange,
}: Props) {
  return (
    <Box mt={1} mx={2}>
      <ConnectedButtonGroup<DisplayMode>
        options={displayModeOptions}
        value={displayMode}
        onChange={onChange}
        size="sm"
        aria-label="Display mode"
      />
    </Box>
  );
});
