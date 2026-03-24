import { Button, HStack, Text, VStack } from "@chakra-ui/react";
import { memo } from "react";
import { playgroundEffects } from "@/src/effects/effects";

type Props = {
  selectedEffectIndices: number[];
  onToggleEffect: (index: number) => void;
};

/** Effect toggles; pattern picker lives above pattern parameters on VJPage. */
export const VJPatternEffectsPanel = memo(function VJPatternEffectsPanel({
  selectedEffectIndices,
  onToggleEffect,
}: Props) {
  return (
    <VStack
      width="100%"
      minW={0}
      maxW="100%"
      ml={2}
      flexWrap="wrap"
      gap={1}
      spacing={0}
      alignItems="flex-start"
    >
      <Text fontSize="md" fontWeight="bold" color="gray.200">
        Choose any number of effects
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
