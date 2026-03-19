import { HStack, Text, VStack } from "@chakra-ui/react";
import { memo } from "react";
import { playgroundEffects } from "@/src/effects/effects";
import { playgroundPatterns } from "@/src/patterns/patterns";
import { VJSelectablePatternEffect } from "@/src/components/VJPage/VJSelectablePatternEffect";

type Props = {
  selectedPatternName: string;
  onSelectPattern: (index: number) => void;

  selectedEffectIndices: number[];
  onToggleEffect: (index: number) => void;
};

export const VJPatternEffectsPanel = memo(function VJPatternEffectsPanel({
  selectedPatternName,
  onSelectPattern,
  selectedEffectIndices,
  onToggleEffect,
}: Props) {
  return (
    <VStack height="100%" flexWrap="wrap" gap={1} spacing={0}>
      <Text fontSize="md" fontWeight="bold">
        Patterns
      </Text>
      <HStack width="100%" flexWrap="wrap" gap={1} spacing={0}>
        {playgroundPatterns.map((p, index) => (
          <VJSelectablePatternEffect
            key={p.name}
            pattern={p}
            selected={p.name === selectedPatternName}
            onSelect={() => onSelectPattern(index)}
          />
        ))}
      </HStack>
      <Text fontSize="md" fontWeight="bold">
        Effects
      </Text>
      <HStack width="100%" flexWrap="wrap" gap={1} spacing={0}>
        {playgroundEffects.map((e, index) => (
          <VJSelectablePatternEffect
            key={e.name}
            pattern={e}
            selected={selectedEffectIndices.includes(index)}
            onSelect={() => onToggleEffect(index)}
          />
        ))}
      </HStack>
    </VStack>
  );
});

