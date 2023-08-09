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
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { memo, useState } from "react";
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
  const [showTooltip, setShowTooltip] = useState(false);
  const min = typeof patternParam.min === "number" ? patternParam.min : 0;
  const max = typeof patternParam.max === "number" ? patternParam.max : 1;
  const step = typeof patternParam.step === "number" ? patternParam.step : 0.01;

  const [valueString, setValueString] = useState(patternParam.value.toString());
  const updateParameterValue = (inputString: string, inputNumber: number) => {
    setValueString(inputString);

    if (Number.isNaN(inputNumber)) return;

    setParameters({ ...parameters, [uniformName]: inputNumber });
    patternParam.value = inputNumber;

    runInAction(() => {
      // Also insert a variation so that this parameter value is serializable
      if (!block.parameterVariations[uniformName])
        block.parameterVariations[uniformName] = [];

      block.parameterVariations[uniformName]![0] = new FlatVariation(
        DEFAULT_VARIATION_DURATION,
        inputNumber
      );
    });
  };

  return (
    <HStack width="100%">
      <VStack width="200px" spacing={1} alignItems="flex-start">
        <ParameterControlName patternParam={patternParam} />
        <NumberInput
          size="xs"
          step={step}
          onChange={updateParameterValue}
          value={valueString}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </VStack>
      <VStack mx={12} flexGrow={1}>
        <Slider
          min={min}
          max={max}
          step={step}
          value={patternParam.value}
          onChange={(inputNumber) =>
            updateParameterValue(inputNumber.toString(), inputNumber)
          }
          focusThumbOnChange={false}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <Tooltip
            hasArrow
            bg="blue.300"
            color="white"
            placement="top"
            isOpen={showTooltip}
            label={patternParam.value}
          >
            <SliderThumb boxSize={5} />
          </Tooltip>
          <SliderMark value={min} {...labelStyles} ml={-7}>
            {min}
          </SliderMark>
          <SliderMark value={max} {...labelStyles} ml={5}>
            {max}
          </SliderMark>
        </Slider>
      </VStack>
    </HStack>
  );
});
