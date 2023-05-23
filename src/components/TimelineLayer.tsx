import { observer } from "mobx-react-lite";
import { TimelineBlockStack } from "@/src/components/TimelineBlockStack";
import { useStore } from "@/src/types/StoreContext";
import { Box } from "@chakra-ui/react";
import { MAX_TIME } from "@/src/utils/time";
import { Layer } from "@/src/types/Layer";
import { action } from "mobx";
import { useRef } from "react";

type TimelineLayerProps = {
  layer: Layer;
};

export const TimelineLayer = observer(function TimelineLayer({
  layer,
}: TimelineLayerProps) {
  const store = useStore();
  const { uiStore, timer, selectedLayer } = store;
  const boxRef = useRef<HTMLDivElement>(null);

  return (
    <Box
      ref={boxRef}
      position="relative"
      width={uiStore.timeToXPixels(MAX_TIME)}
      // TODO: figure out how to size the height of the layers automatically
      height="450px"
      bgColor={selectedLayer === layer ? "gray.300" : "gray.400"} // zebra stripe based on index
      boxSizing="border-box"
      border="1px solid gray"
      onClick={action((e) => {
        store.selectedLayer = layer;

        if (!boxRef.current) return;
        timer.setTime(
          Math.max(
            0,
            uiStore.xToTime(
              e.clientX - boxRef.current.getBoundingClientRect().x
            )
          )
        );
      })}
    >
      {layer.patternBlocks.map((block) => (
        <TimelineBlockStack key={block.id} patternBlock={block} />
      ))}
    </Box>
  );
});
