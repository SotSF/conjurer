import { Text, VStack } from "@chakra-ui/react";
import { Block } from "@/src/types/Block";
import { ParamDefinitions } from "@/src/params/shared/ParamDefinitions";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";

type NewVariationButtonsProps = {
  uniformName: string;
  block: Block;
};

export const NewVariationButtons = observer(function NewVariationButtons({
  uniformName,
  block,
}: NewVariationButtonsProps) {
  const store = useStore();
  // In region-preview mode you build regions within the lane, not old variants.
  if (store.curvesPreview) return null;

  const patternParam = block.pattern.params[uniformName];
  const props = { block, uniformName };

  let buttons: React.ReactNode = (
    <Text fontSize="xs" color="whiteAlpha.500">
      not implemented
    </Text>
  );
  for (const paramDefinition of ParamDefinitions) {
    const rendered = paramDefinition.renderNewVariationButtons(
      patternParam,
      props,
    );
    if (rendered) {
      buttons = rendered;
      break;
    }
  }

  return (
    <VStack
      wrap="wrap"
      pl={1}
      gap={1}
      spacing={0}
      height="60px"
      justify="center"
    >
      {buttons}
    </VStack>
  );
});
