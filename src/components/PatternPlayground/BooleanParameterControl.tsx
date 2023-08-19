import {
  Button,
  HStack,
  NumberInput,
  NumberInputField,
  Switch,
  Text,
  VStack,
  useNumberInput,
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

type BooleanParameterControlProps = {
  block: Block<ExtraParams>;
  uniformName: string;
  patternParam: PatternParam<number>;
  parameters: Record<string, ParamType>;
  setParameters: (params: Record<string, ParamType>) => void;
};

export const BooleanParameterControl = memo(function BooleanParameterControl({
  block,
  uniformName,
  patternParam,
  parameters,
  setParameters,
}: BooleanParameterControlProps) {
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

  const { getIncrementButtonProps, getDecrementButtonProps } = useNumberInput({
    step,
    value: valueString,
    onChange: updateParameterValue,
  });

  return (
    <HStack width="100%">
      <VStack width="150px" spacing={1} alignItems="flex-start">
        <ParameterControlName patternParam={patternParam} />
        <HStack spacing={0}>
          <Button
            size="xs"
            borderTopRightRadius={0}
            borderBottomRightRadius={0}
            {...getDecrementButtonProps()}
          >
            -
          </Button>
          <NumberInput
            size="xs"
            step={step}
            onChange={updateParameterValue}
            value={valueString}
          >
            <NumberInputField
              fontSize="md"
              textAlign="center"
              fontWeight="bold"
              padding={0}
            />
          </NumberInput>
          <Button
            size="xs"
            borderTopLeftRadius={0}
            borderBottomLeftRadius={0}
            {...getIncrementButtonProps()}
          >
            +
          </Button>
        </HStack>
      </VStack>
      <HStack mx={12} flexGrow={1} justify="center">
        <Text>off</Text>
        <Switch
          size="lg"
          isChecked={!!patternParam.value}
          onChange={() => {
            const newValue = patternParam.value ? 0 : 1;
            updateParameterValue(newValue.toString(), newValue);
          }}
        ></Switch>
        <Text>on</Text>
      </HStack>
    </HStack>
  );
});
