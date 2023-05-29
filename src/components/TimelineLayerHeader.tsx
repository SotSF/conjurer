import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { Button, HStack, Heading, IconButton, VStack } from "@chakra-ui/react";
import { Layer } from "@/src/types/Layer";
import { action } from "mobx";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

type Props = {
  index: number;
  layer: Layer;
};

export const TimelineLayerHeader = observer(function TimelineLayerHeader({
  index,
  layer,
}: Props) {
  const store = useStore();
  const { selectedLayer } = store;

  const bgColor = selectedLayer === layer ? "gray.300" : "gray.400";

  return (
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
      <Button
        mt={2}
        color="black"
        size="sm"
        fontSize={12}
        variant="ghost"
        onClick={action((e) => {
          layer.showingOpacityControls = !layer.showingOpacityControls;
          e.stopPropagation();
        })}
      >
        {layer.showingOpacityControls ? "Hide" : "Show"} opacity controls
      </Button>
    </VStack>
  );
});
