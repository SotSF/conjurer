import {
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
} from "@chakra-ui/react";

type Props = {
  name: string;
  step?: number;
  onChange: (valueAsString: string, valueAsNumber: number) => void;
  value: string;
};

export const ScalarInput = ({ name, step = 0.1, onChange, value }: Props) => (
  <HStack width="100%" justify="end" mx={1}>
    <Text>{name}</Text>
    <NumberInput
      width="65%"
      size="xs"
      step={step}
      onChange={onChange}
      value={value}
    >
      <NumberInputField />
      <NumberInputStepper>
        <NumberIncrementStepper />
        <NumberDecrementStepper />
      </NumberInputStepper>
    </NumberInput>
  </HStack>
);
