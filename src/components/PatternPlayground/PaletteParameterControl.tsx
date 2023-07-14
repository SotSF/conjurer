import { HStack, Text } from "@chakra-ui/react";
import { memo, useEffect, useRef, useState } from "react";
import { Block } from "@/src/types/Block";
import {
  ExtraParams,
  ParamType,
  PatternParam,
} from "@/src/types/PatternParams";
import { DEFAULT_VARIATION_DURATION } from "@/src/utils/time";
import { runInAction } from "mobx";
import { Vector4 } from "three";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { Palette } from "@/src/types/Palette";
import { PaletteEditor } from "@/src/components/PalletteEditor/PaletteEditor";
import { PaletteVariation } from "@/src/types/Variations/PaletteVariation";

type PaletteParameterControlProps = {
  block: Block<ExtraParams>;
  uniformName: string;
  patternParam: PatternParam<Palette>;
  parameters: Record<string, ParamType>;
  setParameters: (params: Record<string, ParamType>) => void;
};

export const PaletteParameterControl = memo(function PaletteParameterControl({
  block,
  uniformName,
  patternParam,
  parameters,
  setParameters,
}: PaletteParameterControlProps) {
  const variation = block.parameterVariations[uniformName]?.[0];

  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (variation || initialized) return;
    setInitialized(true);

    runInAction(() => {
      if (!block.parameterVariations[uniformName])
        block.parameterVariations[uniformName] = [];

      block.parameterVariations[uniformName]![0] = new PaletteVariation(
        DEFAULT_VARIATION_DURATION,
        patternParam.value
      );
      console.log(block.parameterVariations[uniformName]![0]);
    });
  }, [
    block.parameterVariations,
    patternParam.value,
    uniformName,
    variation,
    initialized,
  ]);

  const setParameter = (name: string, value: Vector4) => {
    setParameters({ ...parameters, [name]: value });
    block.pattern.params[name].value = value;

    runInAction(() => {
      // Also insert a variation so that this parameter value is serializable
      if (!block.parameterVariations[name])
        block.parameterVariations[name] = [];

      block.parameterVariations[name]![0] = new LinearVariation4(
        DEFAULT_VARIATION_DURATION,
        value,
        value
      );
    });
  };

  return (
    <HStack pt={6} width="100%" gap={4}>
      <Text fontSize={14}>{patternParam.name}</Text>
      {variation?.type === "palette" && (
        <PaletteEditor
          uniformName={uniformName}
          // do better type discrimination
          variation={variation as PaletteVariation}
          block={block}
        />
      )}
    </HStack>
  );
});
