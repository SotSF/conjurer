import { HStack, Text, VStack } from "@chakra-ui/react";
import { SelectablePatternEffect } from "@/src/components/PatternPlayground/SelectablePatternEffect";
import { Block } from "@/src/types/Block";
import { playgroundPatterns } from "@/src/patterns/patterns";
import { memo } from "react";
import { playgroundEffects } from "@/src/effects/effects";

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
  return (
    <VStack height="100%" flexWrap="wrap" gap={1} spacing={0}>
      <Text fontSize="xl" fontWeight="bold">
        Patterns
      </Text>
      <HStack width="100%" flexWrap="wrap" gap={1} spacing={0}>
        {playgroundPatterns.map((p, index) => (
          <SelectablePatternEffect
            key={p.name}
            pattern={p}
            selected={p === selectedPatternBlock.pattern}
            onSelect={() => onSelectPatternBlock(index)}
          />
        ))}
      </HStack>
      <Text fontSize="xl" fontWeight="bold">
        Effects
      </Text>
      <HStack width="100%" flexWrap="wrap" gap={1} spacing={0}>
        <SelectablePatternEffect
          pattern={{ name: "None" }}
          selected={!selectedEffectBlock}
          onSelect={() => onSelectEffectBlock(-1)}
        />
        {playgroundEffects.map((e, index) => (
          <SelectablePatternEffect
            key={e.name}
            pattern={e}
            selected={e === selectedEffectBlock?.pattern}
            onSelect={() => onSelectEffectBlock(index)}
          />
        ))}
      </HStack>
    </VStack>
  );
});
