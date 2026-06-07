import { Box } from "@chakra-ui/react";
import { Block } from "@/src/types/Block";
import { PaletteVariation } from "@/src/types/Variations/PaletteVariation";
import { VARIATION_BOUND_WIDTH } from "@/src/utils/layout";
import { vector3ToRgbaString } from "@/src/utils/color";
import { useVariationClick } from "@/src/hooks/variationClick";

type PaletteVariationGraphProps = {
  uniformName: string;
  variation: PaletteVariation;
  width: number;
  block: Block;
};

export const PaletteVariationGraph = function PaletteVariationGraph({
  uniformName,
  variation,
  width,
  block,
}: PaletteVariationGraphProps) {
  const { palette } = variation;
  const colorCells = 14;
  const colorCellSize = (width - VARIATION_BOUND_WIDTH) / colorCells;

  const onVariationClick = useVariationClick(block, uniformName);

  return (
    <Box
      py={1}
      width={`${width - VARIATION_BOUND_WIDTH}px`}
      _hover={{ bgColor: "gray.500" }}
      onClick={(e) => onVariationClick(e, variation)}
    >
      <svg width={width - VARIATION_BOUND_WIDTH} height={60}>
        <defs>
          {Array.from({ length: colorCells }).map((_, i) => (
            <linearGradient
              key={i}
              id={`gradient${variation.id}-${i}`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor={vector3ToRgbaString(palette.colorAt(i / colorCells))}
              ></stop>
              <stop
                offset="100%"
                stopColor={vector3ToRgbaString(
                  palette.colorAt((i + 1) / colorCells),
                )}
              ></stop>
            </linearGradient>
          ))}
        </defs>
        {Array.from({ length: colorCells }).map((_, i) => (
          <rect
            key={i}
            width={colorCellSize + 1}
            height="100%"
            x={colorCellSize * i - 1}
            y="0"
            fill={`url(#gradient${variation.id}-${i})`}
          />
        ))}
      </svg>
    </Box>
  );
};
