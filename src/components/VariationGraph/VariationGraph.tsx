import {
  Box,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
  Portal,
} from "@chakra-ui/react";
import { Variation } from "@/src/types/Variations/Variation";
import { Block } from "@/src/types/Block";
import { VariationControls } from "@/src/components/VariationControls";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { ScalarVariationGraph } from "@/src/components/VariationGraph/ScalarVariationGraph";
import { LinearVariationGraph4 } from "@/src/components/VariationGraph/LinearVariationGraph4";
import { SplineVariation } from "@/src/types/Variations/SplineVariation";

type VariationGraphProps = {
  uniformName: string;
  variation: Variation;
  width: number;
  domain: [number, number];
  block: Block;
};

export const VariationGraph = function VariationGraph({
  uniformName,
  variation,
  width,
  domain,
  block,
}: VariationGraphProps) {
  const variationGraph =
    variation instanceof LinearVariation4 ? (
      <LinearVariationGraph4
        uniformName={uniformName}
        variation={variation}
        width={width}
        domain={domain}
        block={block}
      />
    ) : (
      <ScalarVariationGraph
        uniformName={uniformName}
        variation={variation}
        width={width}
        domain={domain}
        block={block}
      />
    );

  if (variation instanceof SplineVariation) return variationGraph;

  return (
    <Popover
      placement="right"
      isLazy
      returnFocusOnClose={false}
      openDelay={0}
      closeDelay={0}
    >
      <PopoverTrigger>
        <Box>{variationGraph}</Box>
      </PopoverTrigger>
      <Portal>
        <PopoverContent zIndex={40}>
          <PopoverArrow />
          <VariationControls
            variation={variation}
            uniformName={uniformName}
            block={block}
          />
        </PopoverContent>
      </Portal>
    </Popover>
  );
};
