import { HStack } from "@chakra-ui/react";
import { memo, useState } from "react";
import { Block } from "@/src/types/Block";
import {
  ExtraParams,
  ParamType,
  PatternParam,
} from "@/src/types/PatternParams";
import { DEFAULT_VARIATION_DURATION } from "@/src/utils/time";
import { runInAction } from "mobx";
import { Vector4 } from "three";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { hexToRgb, vector4ToHex } from "@/src/utils/color";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { VJParameterControlName } from "@/src/components/VJPage/VJParameterControlName";
import { useEffect } from "react";

type VJColorParameterControlProps = {
  block: Block<ExtraParams>;
  uniformName: string;
  patternParam: PatternParam<Vector4>;
  parameters: Record<string, ParamType>;
  setParameters: (params: Record<string, ParamType>) => void;
};

export const VJColorParameterControl = memo(function VJColorParameterControl({
  block,
  uniformName,
  patternParam,
  parameters,
  setParameters,
}: VJColorParameterControlProps) {
  const setParameter = (value: Vector4) => {
    setParameters({ ...parameters, [uniformName]: value });
    block.pattern.params[uniformName].value = value;

    runInAction(() => {
      // Also insert a variation so that this parameter value is serializable
      if (!block.parameterVariations[uniformName])
        block.parameterVariations[uniformName] = [];

      block.parameterVariations[uniformName]![0] = new LinearVariation4(
        DEFAULT_VARIATION_DURATION,
        value,
        value,
      );
    });
  };

  const [color, setColor] = useState(vector4ToHex(patternParam.value));

  useEffect(() => {
    setColor(vector4ToHex(patternParam.value));
  }, [patternParam]);

  const onColorChange = (newHex: string) => {
    setColor(newHex);
    const rgb = hexToRgb(newHex);
    patternParam.value.set(rgb.r / 255, rgb.g / 255, rgb.b / 255, 1);
    setParameter(patternParam.value);
  };

  return (
    <HStack
      pt={6}
      width="100%"
      maxW="100%"
      minW={0}
      flexWrap="wrap"
      gap={4}
    >
      <VJParameterControlName patternParam={patternParam} />
      <HexColorInput
        className="hexColorInput"
        color={color}
        onChange={onColorChange}
      />
      <HexColorPicker color={color} onChange={onColorChange} />
    </HStack>
  );
});

