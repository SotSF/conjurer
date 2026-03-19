import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { memo, useRef } from "react";
import { playgroundEffects } from "@/src/effects/effects";
import { playgroundPatterns } from "@/src/patterns/patterns";

type Props = {
  selectedPatternName: string;
  selectedPatternIndex: number;
  onSelectPattern: (index: number) => void;

  selectedEffectIndices: number[];
  onToggleEffect: (index: number) => void;
};

export const VJPatternEffectsPanel = memo(function VJPatternEffectsPanel({
  selectedPatternName,
  selectedPatternIndex,
  onSelectPattern,
  selectedEffectIndices,
  onToggleEffect,
}: Props) {
  const patternRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const patternCount = playgroundPatterns.length;

  const focusPattern = (index: number) => {
    const el = patternRefs.current[index];
    el?.focus();
  };

  const selectAndFocusPattern = (index: number) => {
    onSelectPattern(index);
    // Defer focus until after React updates (keeps focus stable).
    queueMicrotask(() => focusPattern(index));
  };

  const onPatternKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (patternCount === 0) return;

    const prev = (index - 1 + patternCount) % patternCount;
    const next = (index + 1) % patternCount;

    switch (e.key) {
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        selectAndFocusPattern(prev);
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        selectAndFocusPattern(next);
        break;
      case "Home":
        e.preventDefault();
        selectAndFocusPattern(0);
        break;
      case "End":
        e.preventDefault();
        selectAndFocusPattern(patternCount - 1);
        break;
    }
  };

  return (
    <VStack
      width="100%"
      px={2}
      py={2}
      flexWrap="wrap"
      gap={1}
      spacing={0}
      alignItems="flex-start"
    >
      <Text fontSize="md" fontWeight="bold">
        Pattern
      </Text>
      <HStack
        width="100%"
        flexWrap="wrap"
        gap={1}
        spacing={0}
        role="radiogroup"
        aria-label="Patterns"
      >
        {playgroundPatterns.map((p, index) => {
          const selected = p.name === selectedPatternName;
          return (
            <Button
              key={p.name}
              ref={(el) => {
                patternRefs.current[index] = el;
              }}
              role="radio"
              aria-checked={selected}
              tabIndex={index === selectedPatternIndex ? 0 : -1}
              size="sm"
              variant={selected ? "solid" : "outline"}
              colorScheme={selected ? "teal" : "gray"}
              onClick={() => selectAndFocusPattern(index)}
              onKeyDown={(e) => onPatternKeyDown(e, index)}
            >
              {p.name}
            </Button>
          );
        })}
      </HStack>
      <Box height={2} />
      <Text fontSize="md" fontWeight="bold">
        Effects
      </Text>
      <HStack width="100%" flexWrap="wrap" gap={1} spacing={0}>
        {playgroundEffects.map((e, index) => {
          const selected = selectedEffectIndices.includes(index);
          return (
            <Button
              key={e.name}
              size="sm"
              variant={selected ? "solid" : "outline"}
              colorScheme={selected ? "teal" : "gray"}
              onClick={() => onToggleEffect(index)}
            >
              {e.name}
            </Button>
          );
        })}
      </HStack>
    </VStack>
  );
});

