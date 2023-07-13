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
  const setParameter = (name: string, value: number) => {
    setParameters({ ...parameters, [name]: value });
    block.pattern.params[name].value = value;

    runInAction(() => {
      // Also insert a flat variation so that this parameter value is serializable
      if (!block.parameterVariations[name])
        block.parameterVariations[name] = [];

      block.parameterVariations[name]![0] = new FlatVariation(
        DEFAULT_VARIATION_DURATION,
        value
      );
    });
  };

  return (
    <VStack key={uniformName} mt={4} width="100%">
      <HStack width="100%" mt={6} justify="space-between">
        <Text fontSize={12}>{patternParam.name}</Text>
        <NumberInput
          size="sm"
          step={0.1}
          onChange={(valueString) => {
            setParameter(uniformName, parseFloat(valueString));
          }}
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
        min={0}
        max={1}
        step={0.001}
        defaultValue={patternParam.value}
        onChange={(value) => setParameter(uniformName, value)}
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
  );
});
