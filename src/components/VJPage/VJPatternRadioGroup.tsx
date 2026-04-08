import { Button, HStack } from "@chakra-ui/react";
import { memo, useRef } from "react";
import { vjPatterns } from "@/src/components/VJPage/vjPageCatalog";

export type VJPatternRadioGroupProps = {
  selectedPatternName: string;
  selectedPatternIndex: number;
  onSelectPattern: (index: number) => void;
};

/**
 * Keyboard-navigable pattern picker (radiogroup). Same behavior as the former
 * pattern section in VJPatternEffectsPanel.
 */
export const VJPatternRadioGroup = memo(function VJPatternRadioGroup({
  selectedPatternName,
  selectedPatternIndex,
  onSelectPattern,
}: VJPatternRadioGroupProps) {
  const patternRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const patternCount = vjPatterns.length;

  const focusPattern = (index: number) => {
    const el = patternRefs.current[index];
    el?.focus();
  };

  const selectAndFocusPattern = (index: number) => {
    onSelectPattern(index);
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
    <HStack
      width="100%"
      minW={0}
      maxW="100%"
      flexWrap="wrap"
      gap={1}
      spacing={0}
      role="radiogroup"
      aria-label="Patterns"
    >
      {vjPatterns.map((p, index) => {
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
  );
});
