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
  Text,
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
  const min = patternParam.min ? patternParam.min : 0;
  const max = patternParam.max ? patternParam.max : 1;
  const step = patternParam.step ? patternParam.step : 0.01;

  const setParameter = (value: number) => {
    value = parseFloat((Math.round(value / step) * step).toFixed(3)); 

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
    <VStack mt={4} width="100%">
      <HStack width="100%" mt={6} justify="space-between">
        <Text fontSize={14}>{patternParam.name}</Text>
        <NumberInput
          size="sm"
          step={step}
          onChange={(valueString) => setParameter(parseFloat(valueString))}
          value={patternParam.value}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </HStack>
      <Slider
        min={min}
        max={max}
        step={step}
        value={patternParam.value}
        onChange={(value) => setParameter(value)}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb boxSize={5} />
        <SliderMark value={min} {...labelStyles} ml={-5}>
          {min}
        </SliderMark>
        <SliderMark value={max} {...labelStyles} ml={4}>
          {max}
        </SliderMark>
      </Slider>
    </VStack>
  );
});
