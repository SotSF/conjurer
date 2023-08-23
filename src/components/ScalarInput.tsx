import {
  Button,
  HStack,
  NumberInput,
  NumberInputField,
  Text,
  useNumberInput,
} from "@chakra-ui/react";

type Props = {
  name: string;
  step?: number;
  onChange: (valueAsString: string, valueAsNumber: number) => void;
  value: string;
};

export const ScalarInput = ({ name, step = 0.1, onChange, value }: Props) => {
  const { getIncrementButtonProps, getDecrementButtonProps } = useNumberInput({
    step,
    value,
    onChange,
  });

  return (
    <HStack width="100%" justify="end" mx={1}>
      <Text>{name}</Text>
      <HStack width="65%" spacing={0}>
        <Button
          size="xs"
          borderTopRightRadius={0}
          borderBottomRightRadius={0}
          {...getDecrementButtonProps()}
        >
          -
        </Button>
        <NumberInput size="xs" step={step} onChange={onChange} value={value}>
          <NumberInputField textAlign="center" padding={0} />
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
    </HStack>
  );
};
