import { observer } from "mobx-react-lite";
import { TimelineBlockStack } from "@/src/components/TimelineBlockStack";
import { useStore } from "@/src/types/StoreContext";
import { Box, HStack, Heading, IconButton, VStack } from "@chakra-ui/react";
import { MAX_TIME } from "@/src/utils/time";
import { Layer } from "@/src/types/Layer";
import { action } from "mobx";
import { useRef } from "react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

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

  const bgColor = selectedLayer === layer ? "gray.300" : "gray.400";

  return (
    <HStack
      height={`${layer.height}px`}
      alignItems="flex-start"
      spacing={0}
      onClick={action(() => {
        store.selectedLayer = layer;
      })}
    >
      <VStack
        position="sticky"
        left={0}
        width="150px"
        height="100%"
        flexShrink={0}
        spacing={0}
        zIndex={11}
        boxSizing="border-box"
        borderRightWidth={1}
        borderBottomWidth={1}
        borderColor="black"
        bgColor={bgColor}
      >
        <HStack width="100%" justify="center" m={1} spacing={0}>
          <Heading color="black" fontSize={16} userSelect="none">
            Layer {index + 1}
          </Heading>
          <IconButton
            position="absolute"
            right={1}
            width={6}
            height={6}
            variant="ghost"
            color="gray.500"
            aria-label="Loop time range"
            title="Loop time range"
            icon={
              layer.visible ? (
                <AiFillEye size={17} />
              ) : (
                <AiFillEyeInvisible size={17} />
              )
            }
            onClick={action((e) => {
              layer.visible = !layer.visible;
              e.stopPropagation();
            })}
          />
        </HStack>
      </VStack>
      <Box
        ref={boxRef}
        id={`timeline-layer-${layer.id}`}
        position="relative"
        width={uiStore.timeToXPixels(MAX_TIME)}
        height="100%"
        boxSizing="border-box"
        bgColor={bgColor}
        borderBottomWidth={1}
        borderColor="black"
        borderStyle="dotted"
        onClick={action((e) =>
          timer.setTime(
            Math.max(
              0,
              uiStore.xToTime(
                e.clientX - boxRef.current!.getBoundingClientRect().x
              )
            )
          )
        )}
      >
        {layer.patternBlocks.map((block) => (
          <TimelineBlockStack key={block.id} patternBlock={block} />
        ))}
      </Box>
    </HStack>
  );
});
