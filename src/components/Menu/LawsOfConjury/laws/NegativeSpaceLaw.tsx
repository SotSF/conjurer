import { LawVideo } from "@/src/components/Menu/LawsOfConjury/LawVideo";
import { HStack, Text, VStack } from "@chakra-ui/react";

export function NegativeSpaceLaw() {
  return (
    <VStack alignItems="flex-start" spacing={3}>
      <Text>
        Next, you should seek to incorporate lots of black or "negative space"
        and ideally never have every light on the canopy on.
      </Text>
      <HStack alignItems="flex-start" spacing={4}>
        <VStack alignItems="center" spacing={2}>
          <Text fontWeight="semibold">❌ No</Text>
          <LawVideo src="/laws-of-conjury/negative-space-1.loop.webm" />
        </VStack>
        <VStack alignItems="center" spacing={2}>
          <Text fontWeight="semibold">✅ Yes</Text>
          <LawVideo src="/laws-of-conjury/negative-space-2.loop.webm" />
        </VStack>
      </HStack>
      <Text>
        This is another difference between viewing your patterns on a computer
        screen versus seeing them live on the canopy. While the left image
        appears to have interesting contrast between the different colors on a
        computer screen, that's very much harder to discern on the canopy.
      </Text>
      <Text>
        <strong>Incorporate lots of black!</strong> Try using the "Threshold"
        effect on your patterns to turn more parts of a pattern black.
      </Text>
    </VStack>
  );
}
