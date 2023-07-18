import {
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  VStack,
} from "@chakra-ui/react";
import { memo } from "react";
import { Block } from "@/src/types/Block";
import {
  ExtraParams,
  ParamType,
  PatternParam,
} from "@/src/types/PatternParams";
import { FlatVariation } from "@/src/types/Variations/FlatVariation";
import { DEFAULT_VARIATION_DURATION } from "@/src/utils/time";
import { runInAction } from "mobx";
import { ParameterControlName } from "@/src/components/PatternPlayground/ParameterControlName";

const labelStyles = {
  mt: -3,
  fontSize: "sm",
};

type ScalarParameterControlProps = {
  block: Block<ExtraParams>;
  uniformName: string;
  patternParam: PatternParam<number>;
  parameters: Record<string, ParamType>;
  setParameters: (params: Record<string, ParamType>) => void;
};

export const ScalarParameterControl = memo(function ScalarParameterControl({
  block,
  uniformName,
  patternParam,
  parameters,
  setParameters,
}: ScalarParameterControlProps) {
  const setParameter = (value: number) => {
    setParameters({ ...parameters, [uniformName]: value });
    block.pattern.params[uniformName].value = value;

    runInAction(() => {
      // Also insert a variation so that this parameter value is serializable
      if (!block.parameterVariations[uniformName])
        block.parameterVariations[uniformName] = [];

      block.parameterVariations[uniformName]![0] = new FlatVariation(
        DEFAULT_VARIATION_DURATION,
        value
      );
    });
  };

  return (
    <HStack width="100%">
      <VStack width="200px" alignItems="flex-start">
        <ParameterControlName patternParam={patternParam} />
        <NumberInput
          size="xs"
          step={0.1}
          onChange={(valueString) => setParameter(parseFloat(valueString))}
          value={patternParam.value}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </VStack>
      <VStack mx={6} flexGrow={1}>
        <Slider
          min={0}
          max={1}
          step={0.001}
          defaultValue={patternParam.value}
          onChange={(value) => setParameter(value)}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb boxSize={5} />
          <SliderMark value={0} {...labelStyles} ml={-5}>
            0
          </SliderMark>
          <SliderMark value={1} {...labelStyles} ml={4}>
            1
          </SliderMark>
        </Slider>
      </VStack>
    </HStack>
  );
});
