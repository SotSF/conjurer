import { observer } from "mobx-react-lite";
import { TimelineBlockStack } from "@/src/components/TimelineBlockStack";
import { useStore } from "@/src/types/StoreContext";
import { Box } from "@chakra-ui/react";
import { MAX_TIME } from "@/src/utils/time";
import { Layer } from "@/src/types/Layer";
import { action } from "mobx";

type TimelineLayerProps = {
  index: number;
  layer: Layer;
};

export const TimelineLayer = observer(function TimelineLayer({
  index,
  layer,
}: TimelineLayerProps) {
  const store = useStore();
  const { uiStore, selectedLayer } = store;

  return (
    <Box
      position="relative"
      width={uiStore.timeToXPixels(MAX_TIME)}
      // TODO: figure out how to size the height of the layers automatically
      height="400px"
      bgColor={selectedLayer === layer ? "gray.300" : "gray.400"} // zebra stripe based on index
      boxSizing="border-box"
      border="1px solid gray"
      onClick={action((e) => {
        store.selectedLayer = layer;
      })}
    >
      {layer.patternBlocks.map((block) => (
        <TimelineBlockStack key={block.id} patternBlock={block} />
      ))}
    </Box>
  );
});
