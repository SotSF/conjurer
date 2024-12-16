import { observer } from "mobx-react-lite";
import { Button, Heading, VStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { ScalarInput } from "@/src/components/ScalarInput";
import { SaveBeatMapModal } from "@/src/components/SaveBeatMapModal";
import { LoadBeatMapModal } from "@/src/components/LoadBeatMapModal";

type ComputedBeatsPanelProps = {
  tempoString: string;
  setTempoString: (value: string) => void;
  tempoOffsetString: string;
  setTempoOffsetString: (value: string) => void;
};

export const ComputedBeatsPanel = observer(function ComputedBeatsPanel({
  tempoString,
  setTempoString,
  tempoOffsetString,
  setTempoOffsetString,
}: ComputedBeatsPanelProps) {
  const store = useStore();
  const { audioStore, uiStore } = store;

  return (
    <VStack m={2} p={2} width="350px" borderWidth={1} borderColor="pink.500">
      <Heading color="pink.500" size="sm">
        Computed beats
      </Heading>
      <ScalarInput
        name="Song tempo (BPM)"
        value={tempoString}
        onChange={(valueString) => setTempoString(valueString)}
        step={0.01}
      />
      <ScalarInput
        name="Song tempo offset (seconds)"
        value={tempoOffsetString}
        onChange={(valueString) => setTempoOffsetString(valueString)}
        step={0.01}
      />
      <Button
        size="sm"
        onClick={action(() => (uiStore.showingSaveBeatMapModal = true))}
      >
        Save computed beat data
      </Button>
      <Button
        size="sm"
        onClick={action(() => (uiStore.showingLoadBeatMapModal = true))}
      >
        Open computed beat data
      </Button>
      <SaveBeatMapModal key={audioStore.selectedSong.id} />
      <LoadBeatMapModal />
    </VStack>
  );
});
