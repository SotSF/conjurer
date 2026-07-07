import { Variation } from "@/src/types/Variations/Variation";
import { Block } from "@/src/types/Block";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { NumberVariationGraph } from "@/src/components/VariationGraph/NumberVariationGraph";
import { LinearVariationGraph4 } from "@/src/components/VariationGraph/LinearVariationGraph4";
import { PaletteVariation } from "@/src/params/palette/variation/PaletteVariation";
import { PaletteVariationGraph } from "@/src/params/palette/variation/VariationGraph";

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
  const props = { uniformName, width, block };
  return variation instanceof LinearVariation4 ? (
    <LinearVariationGraph4 {...props} variation={variation} />
  ) : variation instanceof PaletteVariation ? (
    <PaletteVariationGraph {...props} variation={variation} />
  ) : (
    <NumberVariationGraph {...props} variation={variation} domain={domain} />
  );
};
