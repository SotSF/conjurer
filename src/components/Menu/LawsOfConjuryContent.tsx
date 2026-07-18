import { Heading, Text, VStack } from "@chakra-ui/react";
import { ReactNode } from "react";

type Law = {
  title: string;
  body: ReactNode;
};

const LAWS: Law[] = [
  {
    title: "Speed Limit",
    body: (
      <Text>
        Patterns should change slowly enough that the eye can follow them.
      </Text>
    ),
  },
  {
    title: "Negative Space",
    body: (
      <Text>
        Leave darkness and empty space so the light has room to breathe.
      </Text>
    ),
  },
  {
    title: "Viewing Angle",
    body: (
      <Text>
        Design for how the canopy is seen from the ground, not only from above.
      </Text>
    ),
  },
];

export function LawsOfConjuryContent() {
  return (
    <VStack alignItems="flex-start" spacing={8} maxW="40rem">
      <Text>
        After years of trying different things on the canopy, we have developed
        a good sense of what <strong>works well on the canopy</strong> ✅ and
        what <strong>doesn&apos;t</strong> ❌. To save you from discovering
        these things yourself the hard way, we have come up with these Laws of
        Conjury.
      </Text>
      {LAWS.map((law) => (
        <VStack key={law.title} alignItems="flex-start" spacing={2}>
          <Heading size="md">{law.title}</Heading>
          {law.body}
        </VStack>
      ))}
    </VStack>
  );
}
