import { HStack, Text, VStack } from "@chakra-ui/react";
import { SelectablePattern } from "@/src/components/PatternPlayground/SelectablePattern";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { Block } from "@/src/types/Block";
import { patterns } from "@/src/patterns/patterns";
import { memo } from "react";
import { effects } from "@/src/effects/effects";

type Props = {
  selectedPatternBlock: Block;
  onSelectPatternBlock: (index: number) => void;
  selectedEffectBlock: Block | null;
  onSelectEffectBlock: (index: number) => void;
};

export const PatternList = memo(function PatternList({
  selectedPatternBlock,
  onSelectPatternBlock,
  selectedEffectBlock,
  onSelectEffectBlock,
}: Props) {
  const store = useStore();
  const { uiStore } = store;

  return (
    <VStack height="100%" flexWrap="wrap" gap={1} spacing={0}>
      <Text fontSize="xl" fontWeight="bold">
        Patterns
      </Text>
      <HStack width="100%" flexWrap="wrap" gap={1} spacing={0}>
        {patterns.map((p, index) => (
          <SelectablePattern
            key={p.name}
            pattern={p}
            selected={p === selectedPatternBlock.pattern}
            onSelect={() => onSelectPatternBlock(index)}
            onInsert={action(() => {
              store.selectedLayer.insertCloneOfBlock(selectedPatternBlock);
              uiStore.patternDrawerOpen = false;
            })}
          />
        ))}
      </HStack>
      <Text fontSize="xl" fontWeight="bold">
        Effects
      </Text>
      <HStack width="100%" flexWrap="wrap" gap={1} spacing={0}>
        {effects.map((e, index) => (
          <SelectablePattern
            key={e.name}
            pattern={e}
            selected={e === selectedEffectBlock?.pattern}
            onSelect={() => onSelectEffectBlock(index)}
            onInsert={action(() => {
              // TODO:
            })}
          />
        ))}
      </HStack>
    </VStack>
  );
});
