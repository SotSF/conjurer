import { useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import {
  Button,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";

// not currently used
// previous implementation:
/* <Popover
        placement="bottom"
        isLazy
        returnFocusOnClose={false}
        openDelay={0}
        closeDelay={0}
      >
        <PopoverTrigger>
          <IconButton
            aria-label="Tempo"
            title="Tempo"
            height={6}
            icon={<FaDrum size={17} />}
          />
        </PopoverTrigger>
        <Portal>
          <PopoverContent>
            <TempoControls />
          </PopoverContent>
        </Portal>
      </Popover> */

export const SnapSettings = observer(function SnapSettings() {
  const store = useStore();
  const { uiStore } = store;
  const [recording, setRecording] = useState(false);
  const [beatsPerMinute, setBeatsPerMinute] = useState(
    `${60 / uiStore.beatLength}`
  );
  const taps = useRef([] as number[]);

  return (
    <VStack alignItems="center" p={3}>
      <Text>Beats per Minute</Text>
      <NumberInput
        size="md"
        step={0.1}
        onChange={action((valueString) => {
          const value = parseFloat(valueString);
          if (!isNaN(value)) uiStore.beatLength = 60 / value;
          setBeatsPerMinute(valueString);
        })}
        value={beatsPerMinute}
      >
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
      <Button
        color={recording ? "red.500" : "white"}
        onClick={action(() => {
          if (!recording) {
            setRecording(true);
          }

          taps.current.push(Date.now());
          if (taps.current.length >= 4) {
            // TODO: can do better here
            const averageBeatTime =
              ((taps.current[taps.current.length - 1] - taps.current[0]) /
                taps.current.length) *
              0.001;
            uiStore.beatLength = averageBeatTime;
            setBeatsPerMinute(`${60 / averageBeatTime}`);
            taps.current = [];
            setRecording(false);
          }
        })}
      >
        Tap Tempo
      </Button>
    </VStack>
  );
});
