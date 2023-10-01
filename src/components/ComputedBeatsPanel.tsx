import { observer } from "mobx-react-lite";
import { Button, Heading, VStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useEffect, useRef, useState } from "react";
import { runInAction } from "mobx";
import { ScalarInput } from "@/src/components/ScalarInput";
import { SaveBeatsModal } from "@/src/components/SaveBeatsModal";

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
      <Button size="sm" onClick={() => (uiStore.showingSaveBeatsModal = true)}>
        Save computed beat data
      </Button>
      <SaveBeatsModal />
    </VStack>
  );
});
