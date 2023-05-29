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
      <HStack
        position="relative"
        width="100%"
        justify="center"
        m={3}
        spacing={0}
      >
        <Heading color="black" fontSize={16} userSelect="none">
          Layer {index + 1}
        </Heading>
        <IconButton
          position="absolute"
          right={1}
          width={6}
          height={6}
          variant="ghost"
          color={layer.visible ? "gray.500" : "red.600"}
          aria-label="Toggle layer visibility"
          title="Toggle layer visibility"
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
      <HStack
        position="absolute"
        bottom={0}
        height="80px"
        justify="center"
        spacing={0}
      >
        <Button
          color={layer.showingOpacityControls ? "white" : "black"}
          size="sm"
          fontSize={11}
          variant="ghost"
          bgColor={layer.showingOpacityControls ? "blue.800" : "transparent"}
          _hover={{
            bgColor: layer.showingOpacityControls ? "blue.800" : "transparent",
          }}
          onClick={action((e) => {
            layer.showingOpacityControls = !layer.showingOpacityControls;
            e.stopPropagation();
          })}
        >
          {layer.showingOpacityControls ? "Editing" : "Edit"} layer opacity
        </Button>
      </HStack>
    </VStack>
  );
});
