import { LawVideo } from "@/src/components/Menu/LawsOfConjury/LawVideo";
import { HStack, Text, VStack } from "@chakra-ui/react";

export function ViewingAngleLaw() {
  return (
    <VStack alignItems="flex-start" spacing={3}>
      <Text>
        Finally, you should give some consideration to what your experience
        looks like when viewed from different angles.
      </Text>
      <Text>
        This is more important than may be immediately obvious because the view
        that you see in conjurer is actually not a view of the canopy that
        anyone gets in real life. Even a viewer directly under the middle of the
        canopy does not see the entire canopy surface due to the steep angle of
        the LED strips. Put another way, EVERYONE is just seeing a fraction of
        the canopy.
      </Text>
      <Text>
        This "Fire" pattern has a few issues. However it seems nice enough to
        begin with:
      </Text>
      <HStack alignItems="flex-start" spacing={4}>
        <LawVideo src="/laws-of-conjury/viewing-angle-1.loop.webm" />
      </HStack>
      <Text>But look at the viewing experience from the side:</Text>
      <HStack alignItems="flex-start" spacing={4}>
        <LawVideo src="/laws-of-conjury/viewing-angle-2.loop.webm" />
      </HStack>
      <Text>
        Additionally the viewing experience for someone right underneath the
        center of the canopy isn't great for negative space reasons:
      </Text>
      <HStack alignItems="flex-start" spacing={4}>
        <LawVideo src="/laws-of-conjury/viewing-angle-3.loop.webm" />
      </HStack>
      <Text>
        <strong>
          Consider how the pattern will be viewed from various angles.
        </strong>{" "}
        The answer is pretty situational, and this is another rule that can be
        broken at times, but it's something to be aware of. It's probably the
        case that more people see the canopy from the side than from underneath,
        so it's worth catering to their experience as well.
      </Text>
    </VStack>
  );
}
