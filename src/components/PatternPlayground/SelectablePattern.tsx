import { Card, Text, VStack } from "@chakra-ui/react";
import { memo } from "react";
import { Pattern } from "@/src/types/Pattern";

type SelectablePatternProps = {
  pattern: Pattern;
  selected: boolean;
  onSelect: () => void;
  onInsert: () => void;
};

export const SelectablePattern = memo(function SelectablePattern({
  pattern,
  selected,
  onSelect,
  onInsert,
}: SelectablePatternProps) {
  return (
    <Card
      border="solid"
      borderWidth={1}
      zIndex={2}
      alignItems="center"
      cursor="pointer"
      onClick={onSelect}
      onDoubleClick={onInsert}
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
