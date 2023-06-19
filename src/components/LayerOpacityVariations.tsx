import { observer } from "mobx-react-lite";
import { HStack, Text, VStack } from "@chakra-ui/react";
import { Layer } from "@/src/types/Layer";
import { NewVariationButtons } from "@/src/components/NewVariationButtons";
import { ParameterVariations } from "@/src/components/ParameterVariations";

type Props = {
  layer: Layer;
};

export const LayerOpacityVariations = observer(function LayerOpacityVariations({
  layer,
}: Props) {
  return layer.showingOpacityControls ? (
    <VStack
      position="absolute"
      bottom={0}
      left={150}
      width="100%"
      height="80px"
      justify="center"
      align="flex-start"
      bgColor="blue.800"
      borderTopWidth={1}
      borderColor="gray.300"
    >
      {layer.opacityBlock.parameterVariations["u_opacity"]?.length ?? 0 > 0 ? (
        <ParameterVariations
          uniformName={"u_opacity"}
          block={layer.opacityBlock}
        />
      ) : (
        <HStack ml={2}>
          <Text userSelect="none" py={2} fontSize={10}>
            Click to add a variation:
          </Text>
          <NewVariationButtons
            uniformName={"u_opacity"}
            block={layer.opacityBlock}
          />
        </HStack>
      )}
    </VStack>
  ) : null;
});
