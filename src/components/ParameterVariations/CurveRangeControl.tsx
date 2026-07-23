import { CurveVariation } from "@/src/types/Variations/CurveVariation";
import { Block } from "@/src/types/Block";
import { NumberParamInput } from "@/src/components/NumberParamInput";
import {
  Box,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { TbSettings } from "react-icons/tb";

type Props = {
  block: Block;
  uniformName: string;
  variation: CurveVariation;
};

// Compact Min/Max editor for a Curve region's value range, mirroring the old
// spline Min/Max control. The range is the output range the curve occupies:
// editing a bound remaps the region's values proportionally into the new range
// (shape preserved, value at time t follows the range) via remapRange. The
// starting values come from the explicit range if set, else the param's declared
// min/max, else the current node extent.
export const CurveRangeControl = observer(function CurveRangeControl({
  block,
  uniformName,
  variation,
}: Props) {
  const param = block.pattern.params[uniformName];
  const [nodeMin, nodeMax] = variation.computeDomain();
  // The range the values currently occupy — the source of the next remap.
  const effectiveMin = variation.rangeMin ?? param?.min ?? nodeMin;
  const effectiveMax = variation.rangeMax ?? param?.max ?? nodeMax;

  const [minStr, setMinStr] = useState(String(effectiveMin));
  const [maxStr, setMaxStr] = useState(String(effectiveMax));

  const remap = action((toMin: number, toMax: number) => {
    variation.remapRange(effectiveMin, effectiveMax, toMin, toMax);
    block.triggerVariationReactions(uniformName);
  });

  return (
    <Tooltip
      label="Value range (min / max)"
      openDelay={0}
      hasArrow
      placement="top"
      fontSize="xs"
    >
      <Box as="span" display="inline-flex">
        <Popover placement="bottom" isLazy>
          <PopoverTrigger>
            <IconButton
              variant="unstyled"
              size="xs"
              height="14px"
              minW="14px"
              aria-label="Region settings"
              icon={<TbSettings size={12} />}
              color={variation.hasExplicitRange ? "blue.300" : "gray.300"}
              _hover={{ color: "blue.300" }}
              onClick={(e) => {
                // sync the fields to the current effective range when opening
                setMinStr(String(effectiveMin));
                setMaxStr(String(effectiveMax));
                e.stopPropagation();
              }}
            />
          </PopoverTrigger>
      <Portal>
        <PopoverContent width="170px" bg="gray.700" fontSize={10}>
          <PopoverArrow bg="gray.700" />
          <PopoverBody>
            <VStack spacing={1} onClick={(e) => e.stopPropagation()}>
              <Text fontWeight="bold">Value range</Text>
              <NumberParamInput
                name="Min"
                value={minStr}
                onChange={(str, num) => {
                  setMinStr(str);
                  if (!isNaN(num)) remap(num, effectiveMax);
                }}
              />
              <NumberParamInput
                name="Max"
                value={maxStr}
                onChange={(str, num) => {
                  setMaxStr(str);
                  if (!isNaN(num)) remap(effectiveMin, num);
                }}
              />
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Portal>
        </Popover>
      </Box>
    </Tooltip>
  );
});
