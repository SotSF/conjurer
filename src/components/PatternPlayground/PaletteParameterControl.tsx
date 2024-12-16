import { HStack } from "@chakra-ui/react";
import { memo, useCallback, useEffect, useState } from "react";
import { Block } from "@/src/types/Block";
import {
  ExtraParams,
  ParamType,
  PatternParam,
} from "@/src/types/PatternParams";
import { DEFAULT_VARIATION_DURATION } from "@/src/utils/time";
import { runInAction } from "mobx";
import { Palette } from "@/src/types/Palette";
import { PaletteEditor } from "@/src/components/PalletteEditor/PaletteEditor";
import { PaletteVariation } from "@/src/types/Variations/PaletteVariation";
import { ParameterControlName } from "@/src/components/PatternPlayground/ParameterControlName";

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
  const updatePaletteVariation = useCallback(() => {
    runInAction(() => {
      if (!block.parameterVariations[uniformName])
        block.parameterVariations[uniformName] = [];

      block.parameterVariations[uniformName]![0] = new PaletteVariation(
        DEFAULT_VARIATION_DURATION,
        patternParam.value,
      );
    });
  }, [block.parameterVariations, patternParam.value, uniformName]);

  const variation = block.parameterVariations[uniformName]?.[0];
  const [initialized, setInitialized] = useState(false);
  // upon initializing a palette parameter, create a variation if one does not exist
  // TODO: this is janky and probably should be done elsewhere
  useEffect(() => {
    if (variation || initialized) return;
    setInitialized(true);

    updatePaletteVariation();
  }, [updatePaletteVariation, variation, initialized]);

  const setParameter = (value: Palette) => {
    setParameters({ ...parameters, [uniformName]: value });
    block.pattern.params[uniformName].value = value;

    updatePaletteVariation();
  };

  return (
    <HStack width="100%" gap={4}>
      <ParameterControlName patternParam={patternParam} />
      {variation?.type === "palette" && (
        <PaletteEditor
          uniformName={uniformName}
          // TODO: do better type discrimination
          variation={variation as PaletteVariation}
          block={block}
          setPalette={(palette) => setParameter(palette)}
        />
      )}
    </HStack>
  );
});
