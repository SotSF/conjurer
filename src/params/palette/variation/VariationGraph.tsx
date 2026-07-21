import {
  Box,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
} from "@chakra-ui/react";
import { Block } from "@/src/types/Block";
import { PaletteVariation } from "./PaletteVariation";
import { Palette } from "../Palette";
import { PaletteEditor } from "../editor/PaletteEditor";
import { VARIATION_BOUND_WIDTH } from "@/src/utils/layout";
import { vector3ToRgbaString } from "@/src/utils/color";

type PaletteVariationGraphProps = {
  uniformName: string;
  variation: PaletteVariation;
  width: number;
  block: Block;
};

// A palette region rendered as a horizontal gradient band. Clicking it opens
// the palette editor popover for that region.
export const PaletteVariationGraph = function PaletteVariationGraph({
  uniformName,
  variation,
  width,
  block,
}: PaletteVariationGraphProps) {
  const { palette } = variation;
  const colorCells = 14;
  const colorCellSize = (width - VARIATION_BOUND_WIDTH) / colorCells;

  const setPalette = (newPalette: Palette) => {
    variation.palette = newPalette;
    block.triggerVariationReactions(uniformName);
  };

  return (
    <Popover isLazy placement="bottom">
      <PopoverTrigger>
        <Box
          py={1}
          width={`${width - VARIATION_BOUND_WIDTH}px`}
          cursor="pointer"
          _hover={{ bgColor: "gray.500" }}
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
                    stopColor={vector3ToRgbaString(
                      palette.colorAt(i / colorCells),
                    )}
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
      </PopoverTrigger>
      <Portal>
        <PopoverContent
          width="auto"
          bg="#12151c"
          borderColor="#2d3748"
          onClick={(e) => e.stopPropagation()}
        >
          <PopoverArrow bg="#12151c" />
          <PopoverBody>
            <PaletteEditor
              uniformName={uniformName}
              variation={variation}
              block={block}
              setPalette={setPalette}
            />
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
};
