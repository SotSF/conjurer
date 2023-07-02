import { Box } from "@chakra-ui/react";
import { Block } from "@/src/types/Block";
import { memo } from "react";
import { useStore } from "@/src/types/StoreContext";
import { PaletteVariation } from "@/src/types/Variations/PaletteVariation";

type Props = {
  uniformName: string;
  variation: PaletteVariation;
  width: number;
  domain: [number, number];
  block: Block;
};

export const PaletteVariationGraph = memo(function PaletteVariationGraph({
  uniformName,
  variation,
  width,
  block,
}: Props) {
  const store = useStore();

  return (
    <Box
      py={1}
      _hover={{ bgColor: "gray.500" }}
      onClick={() => store.selectVariation(block, uniformName, variation)}
    >
      {JSON.stringify(variation.palette)}
      {/* TODO <svg width={width - VARIATION_BOUND_WIDTH} height={60}>
        <defs>
          <linearGradient
            id={`gradient${variation.id}`}
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop offset="0%" stopColor={fromColor}></stop>
            <stop offset="100%" stopColor={toColor}></stop>
          </linearGradient>
        </defs>
        <rect
          width="100%"
          height="100%"
          x="0"
          y="0"
          fill={`url(#gradient${variation.id})`}
        />
      </svg> */}
    </Box>
  );
});
