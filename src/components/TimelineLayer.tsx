import { observer } from "mobx-react-lite";
import { TimelineBlockStack } from "@/src/components/TimelineBlockStack";
import { useStore } from "@/src/types/StoreContext";
import { Box, HStack, Text, VStack, useToken } from "@chakra-ui/react";
import { MAX_TIME } from "@/src/utils/time";
import { Layer } from "@/src/types/Layer";
import { action } from "mobx";
import { useRef } from "react";
import { TimelineLayerHeader } from "@/src/components/TimelineLayerHeader";
import { Line, LineChart, YAxis } from "recharts";
import { VARIATION_BOUND_WIDTH } from "@/src/utils/layout";
import { ParameterView } from "@/src/components/ParameterView";
import { NewVariationButtons } from "@/src/components/NewVariationButtons";
import { ParameterVariations } from "@/src/components/ParameterVariations";

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
      position="relative"
      height={`${layer.height}px`}
      alignItems="flex-start"
      spacing={0}
      onClick={action(() => {
        store.selectedLayer = layer;
      })}
    >
      <TimelineLayerHeader index={index} layer={layer} />
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
      {layer.showingOpacityControls && (
        <VStack
          position="absolute"
          bottom={0}
          left={150}
          width="100%"
          height="60px"
          align="flex-start"
          bgColor="gray.700"
          boxSizing="border-box"
          borderColor="gray.300"
          borderTopWidth={1}
        >
          {layer.opacityBlock.parameterVariations["u_opacity"]?.length ??
          0 > 0 ? (
            <ParameterVariations
              uniformName={"u_opacity"}
              block={layer.opacityBlock}
            />
          ) : (
            <HStack ml={2}>
              <Text py={2} fontSize={10}>
                Click to add a variation:
              </Text>
              <NewVariationButtons
                uniformName={"u_opacity"}
                block={layer.opacityBlock}
              />
            </HStack>
          )}
        </VStack>
      )}
    </HStack>
  );
});
