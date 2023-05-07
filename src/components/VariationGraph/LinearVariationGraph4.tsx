import { Box } from "@chakra-ui/react";
import { Block } from "@/src/types/Block";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { memo } from "react";
import { vector4ToHex } from "@/src/utils/color";
import { VARIATION_BOUND_WIDTH } from "@/src/utils/layout";

type LinearVariationGraph4Props = {
  uniformName: string;
  variation: LinearVariation4;
  width: number;
  domain: [number, number];
  block: Block;
};

export const LinearVariationGraph4 = memo(function LinearVariationGraph4({
  uniformName,
  variation,
  width,
  block,
}: LinearVariationGraph4Props) {
  const fromColor = vector4ToHex(variation.from);
  const toColor = vector4ToHex(variation.to);
  return (
    <Box py={1} _hover={{ bgColor: "gray.500" }}>
      <svg width={width - VARIATION_BOUND_WIDTH} height={60}>
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
      </svg>
    </Box>
  );
});
