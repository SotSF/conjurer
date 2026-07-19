import { HStack, Text, VStack } from "@chakra-ui/react";
import { LawVideo } from "@/src/components/Menu/LawsOfConjury/LawVideo";

export function SpeedLimitLaw() {
  return (
    <VStack alignItems="flex-start" spacing={3}>
      <Text>The first and most important law is: obey the speed limit!</Text>
      <HStack alignItems="flex-start" spacing={4}>
        <VStack alignItems="center" spacing={2}>
          <Text fontWeight="semibold">❌ No</Text>
          <LawVideo src="/laws-of-conjury/speed-limit-1.loop.webm" />
        </VStack>
        <VStack alignItems="center" spacing={2}>
          <Text fontWeight="semibold">✅ Yes</Text>
          <LawVideo src="/laws-of-conjury/speed-limit-2.loop.webm" />
        </VStack>
      </HStack>
      <Text>
        The first pattern might seem pretty innocuous. It has a wave moving
        across the canopy in the space of one second. On your computer screen
        that might translate to 2 inches per second - literally the pace of a
        turtle.
      </Text>
      <Text>
        <em>But!</em>
      </Text>
      <Text>
        These patterns are destined for a large, 16-foot diameter, 14k LED
        surface with humans viewing from a pretty close distance. And
        importantly, while it's 2 inches per second on your screen, it's{" "}
        <em>16 feet per second</em> on the canopy. That's too fast!
      </Text>
      <Text>
        So this is a very important thing to keep in mind because some patterns
        have defaults that are borderline aggressive, and as you start tweaking
        things yourself it's easy to get something that looks cool but breaks
        this (vaguely defined) speed limit. That said, occasionally going faster
        to make a memorable moment is is probably fine, just keep things on
        average slow and smooth.
      </Text>
      <Text>
        <strong>
          A key takeaway we've had from lots of tinkering is: slowly evolving
          patterns look better than fast and flashy patterns.
        </strong>
      </Text>
    </VStack>
  );
}
