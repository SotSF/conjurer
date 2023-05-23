import { Card, Text, VStack } from "@chakra-ui/react";
import { memo } from "react";
import { Pattern } from "@/src/types/Pattern";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";

type SelectablePatternProps = {
  pattern: Pattern;
  selected: boolean;
  onInsert: () => void;
};

export const SelectablePattern = memo(function SelectablePattern({
  pattern,
  selected,
  onInsert,
}: SelectablePatternProps) {
  const store = useStore();

  const handleSelect = action(() => {
    store.selectedPattern = pattern;
  });

  return (
    <Card
      border="solid"
      borderWidth={1}
      zIndex={2}
      alignItems="center"
      cursor="pointer"
      onClick={handleSelect}
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
