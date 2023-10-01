import { observer } from "mobx-react-lite";
import { Button, Heading, VStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { ScalarInput } from "@/src/components/ScalarInput";
import { SaveBeatMapModal } from "@/src/components/SaveBeatMapModal";

type ComputedBeatsPanelProps = {
  songTempo: string;
  setSongTempo: (value: string) => void;
  songTempoOffset: string;
  setSongTempoOffset: (value: string) => void;
};

export const ComputedBeatsPanel = observer(function ComputedBeatsPanel({
  songTempo,
  setSongTempo,
  songTempoOffset,
  setSongTempoOffset,
}: ComputedBeatsPanelProps) {
  const store = useStore();
  const { uiStore } = store;

  return (
    <VStack m={2} p={2} width="350px" borderWidth={1} borderColor="pink.500">
      <Heading color="pink.500" size="sm">
        Computed beats
      </Heading>
      <ScalarInput
        name="Song tempo (BPM)"
        value={songTempo}
        onChange={(valueString) => setSongTempo(valueString)}
        step={0.01}
      />
      <ScalarInput
        name="Song tempo offset (seconds)"
        value={songTempoOffset}
        onChange={(valueString) => setSongTempoOffset(valueString)}
        step={0.01}
      />
      <Button
        size="sm"
        onClick={action(() => (uiStore.showingSaveBeatMapModal = true))}
      >
        Save computed beat data
      </Button>
      <SaveBeatMapModal />
    </VStack>
  );
});
