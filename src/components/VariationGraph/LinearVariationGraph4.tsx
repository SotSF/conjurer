import {
  Box,
  HStack,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Block } from "@/src/types/Block";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { hexToRgb, vector4ToHex } from "@/src/utils/color";

type LinearVariationGraph4Props = {
  uniformName: string;
  variation: LinearVariation4;
  width: number;
  block: Block;
};

// A Color (vec4 / RGBA) region rendered as a from→to gradient band. Clicking
// the band opens an inline popover with a color picker for each endpoint,
// mirroring PaletteVariationGraph — no gutter panel, no Duration field (the
// region's span is set by boundary-drag in the region model).
export const LinearVariationGraph4 = function LinearVariationGraph4({
  uniformName,
  variation,
  width,
  block,
}: LinearVariationGraph4Props) {
  const fromColor = vector4ToHex(variation.from);
  const toColor = vector4ToHex(variation.to);

  return (
    <Popover isLazy placement="bottom">
      <PopoverTrigger>
        <Box
          py={1}
          width={`${width}px`}
          flexShrink={0}
          cursor="pointer"
          role="button"
          _hover={{ bgColor: "gray.500" }}
        >
          {/* Fill the full region slot (not width - VARIATION_BOUND_WIDTH): the
              region-model seam is drawn by the RegionBoundary overlay at the true
              boundary x, so the band must tile the whole slot to align with the
              region tabs above and reach the block's end. */}
          <svg width={width} height={60}>
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
      </PopoverTrigger>
      <Portal>
        <PopoverContent width="auto" bg="gray.700" fontSize={10} zIndex={1600}>
          <PopoverArrow bg="gray.700" />
          <PopoverBody>
            <ColorEndpoints
              uniformName={uniformName}
              variation={variation}
              block={block}
            />
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
};

// The two endpoint pickers (from → to). Each writes an RGB back into the
// region's Vector4 (alpha kept at 1) and re-triggers the param's reactions so
// the gradient band and the live render update immediately.
function ColorEndpoints({
  uniformName,
  variation,
  block,
}: {
  uniformName: string;
  variation: LinearVariation4;
  block: Block;
}) {
  const [fromHex, setFromHex] = useState(vector4ToHex(variation.from));
  const [toHex, setToHex] = useState(vector4ToHex(variation.to));

  const onFromChange = (hex: string) => {
    setFromHex(hex);
    const { r, g, b } = hexToRgb(hex);
    variation.from.set(r / 255, g / 255, b / 255, 1);
    block.triggerVariationReactions(uniformName);
  };
  const onToChange = (hex: string) => {
    setToHex(hex);
    const { r, g, b } = hexToRgb(hex);
    variation.to.set(r / 255, g / 255, b / 255, 1);
    block.triggerVariationReactions(uniformName);
  };

  return (
    <HStack spacing={3} align="start" onClick={(e) => e.stopPropagation()}>
      <VStack spacing={1}>
        <Text fontWeight="bold">From</Text>
        <HexColorPicker color={fromHex} onChange={onFromChange} />
      </VStack>
      <VStack spacing={1}>
        <Text fontWeight="bold">To</Text>
        <HexColorPicker color={toHex} onChange={onToChange} />
      </VStack>
    </HStack>
  );
}
