import { observer } from "mobx-react-lite";
import { TimelineBlockStack } from "@/src/components/TimelineBlockStack";
import { useStore } from "@/src/types/StoreContext";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { MAX_TIME } from "@/src/utils/time";
import { Layer } from "@/src/types/Layer";
import { action } from "mobx";
import { useRef } from "react";

type TimelineLayerProps = {
  index: number;
  layer: Layer;
};

export const TimelineLayer = observer(function TimelineLayer({
  index,
  layer,
}: TimelineLayerProps) {
  const store = useStore();
  const { uiStore, timer, selectedLayer } = store;
  const boxRef = useRef<HTMLDivElement>(null);

  return (
    <HStack
      // TODO: figure out how to size the height of the layers automatically
      height="350px"
      alignItems="flex-start"
      spacing={0}
    >
      <VStack
        position="sticky"
        left={0}
        width="165px"
        height="100%"
        flexShrink={0}
        spacing={0}
        zIndex={11}
        bgColor="gray.500"
        boxSizing="border-box"
        borderRightWidth={1}
        borderTopWidth={1}
        borderColor="black"
      >
        <Text color="black" fontSize={18} userSelect="none">
          Layer {index + 1}
        </Text>
      </VStack>
      <Box
        ref={boxRef}
        position="relative"
        width={uiStore.timeToXPixels(MAX_TIME)}
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
    </HStack>
  );
});
