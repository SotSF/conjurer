import { observer } from "mobx-react-lite";
import { TimelineBlockStack } from "@/src/components/TimelineBlockStack";
import { useStore } from "@/src/types/StoreContext";
import { Box } from "@chakra-ui/react";
import { MAX_TIME } from "@/src/utils/time";

export const TimelineBlockStacks = observer(function TimelineBlockStacks() {
  const { layers, uiStore } = useStore();

  // TODO: generalize for multiple layers
  const patternBlocks = layers[0]?.patternBlocks ?? [];

  return (
    <Box position="relative" width={uiStore.timeToXPixels(MAX_TIME)}>
      {patternBlocks.map((block) => (
        <TimelineBlockStack key={block.id} patternBlock={block} />
      ))}
    </Box>
  );
});
