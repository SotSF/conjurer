import { Variation } from "@/src/types/Variations/Variation";
import { Block } from "@/src/types/Block";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { ScalarVariationGraph } from "@/src/components/VariationGraph/ScalarVariationGraph";
import { LinearVariationGraph4 } from "@/src/components/VariationGraph/LinearVariationGraph4";

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
  return variation instanceof LinearVariation4 ? (
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
};
