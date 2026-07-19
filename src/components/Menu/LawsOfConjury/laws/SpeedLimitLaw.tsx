import { Text, VStack } from "@chakra-ui/react";
import { LawVideo } from "@/src/components/Menu/LawsOfConjury/LawVideo";

export function SpeedLimitLaw() {
  return (
    <VStack alignItems="flex-start" spacing={3}>
      <Text>The first and most important law is: obey the speed limit!</Text>
      <Text>Let's take this for an example:</Text>
      <LawVideo w="50%" src="/laws-of-conjury/speed-limit-1.loop.webm" />
      <LawVideo w="50%" src="/laws-of-conjury/speed-limit-2.loop.webm" />
      <Text>
        The above pattern may seem pretty innocuous. It has a wave moving across
        the canopy in the space of one second.{" "}
      </Text>
    </VStack>
  );
}
