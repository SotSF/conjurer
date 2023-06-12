import { Card, Text, VStack } from "@chakra-ui/react";
import { memo } from "react";

type Props = {
  pattern: { name: string };
  selected: boolean;
  onSelect: () => void;
};

export const SelectablePatternEffect = memo(function SelectablePattern({
  pattern,
  selected,
  onSelect,
}: Props) {
  return (
    <Card
      border="solid"
      borderWidth={1}
      zIndex={2}
      alignItems="center"
      cursor="pointer"
      onClick={onSelect}
      role="button"
    >
      <VStack width="150px" height={10} justify="center">
        <Text
          textAlign="center"
          userSelect="none"
          color={selected ? "teal.200" : "ButtonText"}
        >
          {selected ? `> ${pattern.name} <` : pattern.name}
        </Text>
      </VStack>
    </Card>
  );
});
