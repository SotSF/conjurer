import { observer } from "mobx-react-lite";
import { TimelineBlockStack } from "@/src/components/TimelineBlockStack";
import { useStore } from "@/src/types/StoreContext";
import { Box } from "@chakra-ui/react";
import { MAX_TIME } from "@/src/utils/time";
import { Layer } from "@/src/types/Layer";

type TimelineLayerProps = {
  index: number;
  layer: Layer;
};

export const TimelineLayer = observer(function TimelineLayer({
  index,
  layer,
}: TimelineLayerProps) {
  const { uiStore, selectedLayer } = useStore();

  return (
    <Box
      position="relative"
      width={uiStore.timeToXPixels(MAX_TIME)}
      // TODO: figure out how to size the height of the layers automatically
      height="400px"
      // zebra stripe based on index
      bgColor={index % 2 === 0 ? "gray.400" : "gray.300"}
      boxSizing="border-box"
      border="1px solid gray"
    >
      {layer.patternBlocks.map((block) => (
        <TimelineBlockStack key={block.id} patternBlock={block} />
      ))}
    </Box>
  );
});
