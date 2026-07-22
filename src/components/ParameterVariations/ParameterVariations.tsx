import { HStack } from "@chakra-ui/react";
import { VariationGraph } from "@/src/components/VariationGraph/VariationGraph";
import { Fragment } from "react";
import { Block } from "@/src/types/Block";
import { VariationBound } from "@/src/components/ParameterVariations/VariationBound";
import { NewVariationButtons } from "@/src/components/ParameterVariations/NewVariationButtons";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";

type ParameterVariationsProps = {
  uniformName: string;
  block: Block;
};

// Just the parameter's curve(s) across the block. Region controls (type,
// reorder, reset, delete) live in the RegionBar above the lane, not here.
export const ParameterVariations = observer(function ParameterVariations({
  uniformName,
  block,
}: ParameterVariationsProps) {
  const store = useStore();
  const { uiStore } = store;
  const width = uiStore.timeToX(block.duration);
  const variations = block.parameterVariations[uniformName] ?? [];

  const domain: [number, number] = [0, 1];
  for (const variation of variations) {
    const [min, max] = variation.computeDomain();
    domain[0] = Math.min(domain[0], min);
    domain[1] = Math.max(domain[1], max);
  }

  return (
    // make variation graphs extend over the block border
    <HStack width="100%" justify="start" spacing={0} mx="-2px">
      {variations.map((variation) => (
        <Fragment key={variation.id}>
          <VariationGraph
            uniformName={uniformName}
            variation={variation}
            width={
              variation.duration < 0
                ? width
                : (variation.duration / block.duration) * width
            }
            domain={domain}
            block={block}
          />
          <VariationBound
            uniformName={uniformName}
            block={block}
            variation={variation}
          />
        </Fragment>
      ))}
      <NewVariationButtons uniformName={uniformName} block={block} />
    </HStack>
  );
});
