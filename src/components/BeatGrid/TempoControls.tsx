import { observer } from "mobx-react-lite";
import {
  Button,
  HStack,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Select,
} from "@chakra-ui/react";
import { action } from "mobx";
import { PiArrowsInLineHorizontalBold } from "react-icons/pi";
import { useStore } from "@/src/types/StoreContext";
import { GRID_DIVISIONS, GridDivisionId } from "@/src/types/BeatGrid";
import { TempoPanel } from "@/src/components/BeatGrid/TempoPanel";
import { useMetronome } from "@/src/hooks/metronome";
import { hoverHelpProps } from "@/src/utils/hoverHelp";

export const TempoControls = observer(function TempoControls() {
  const store = useStore();
  const { uiStore, beatGridStore } = store;

  // Mounted with the toolbar rather than the popover, so the click track keeps
  // running after the panel is dismissed.
  useMetronome();

  const bpm = beatGridStore.bpmAtPlayhead;

  return (
    <HStack spacing={1}>
      <Popover placement="bottom-start" isLazy>
        <PopoverTrigger>
          <Button
            height={6}
            size="xs"
            fontFamily="mono"
            minWidth="72px"
            {...hoverHelpProps(
              uiStore,
              "Tempo",
              beatGridStore.hasMultipleTempos
                ? "Tempo at the playhead. Open to adjust the grid, tap tempo, or check alignment."
                : "Song tempo. Open to adjust the grid, tap tempo, or check alignment.",
            )}
          >
            {bpm.toFixed(2)}
            {beatGridStore.hasMultipleTempos ? "*" : ""}
          </Button>
        </PopoverTrigger>
        <Portal>
          <PopoverContent
            width="340px"
            // Clear sticky timeline chrome (TimerAndWaveform zIndex 12)
            rootProps={{ style: { zIndex: 1600 } }}
          >
            <PopoverArrow />
            <PopoverBody>
              <TempoPanel />
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>

      <Select
        size="xs"
        width="70px"
        height={6}
        value={beatGridStore.divisionId}
        onChange={action((e) =>
          beatGridStore.setDivision(e.target.value as GridDivisionId),
        )}
        {...hoverHelpProps(
          uiStore,
          "Grid division",
          "How finely the grid is subdivided for display and snapping.",
        )}
      >
        {GRID_DIVISIONS.map((division) => (
          <option key={division.id} value={division.id}>
            {division.label}
          </option>
        ))}
      </Select>

      <IconButton
        aria-label="Snap to grid"
        title="Snap to grid"
        height={6}
        icon={<PiArrowsInLineHorizontalBold size={17} />}
        bgColor={beatGridStore.snapEnabled ? "orange.700" : undefined}
        _hover={beatGridStore.snapEnabled ? { bgColor: "orange.600" } : undefined}
        onClick={action(() => beatGridStore.toggleSnapping())}
        {...hoverHelpProps(
          uiStore,
          "Snap to grid",
          "Pull blocks, regions, and curve points onto the nearest grid line. Hold ⌃ to bypass.",
        )}
      />

    </HStack>
  );
});
