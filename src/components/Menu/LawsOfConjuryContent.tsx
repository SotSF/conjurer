import { Heading, Text, VStack } from "@chakra-ui/react";
import { ReactNode } from "react";
import { NegativeSpaceLaw } from "@/src/components/Menu/LawsOfConjury/laws/NegativeSpaceLaw";
import { SpeedLimitLaw } from "@/src/components/Menu/LawsOfConjury/laws/SpeedLimitLaw";
import { ViewingAngleLaw } from "@/src/components/Menu/LawsOfConjury/laws/ViewingAngleLaw";

type Law = {
  title: string;
  content: ReactNode;
};

const LAWS: Law[] = [
  {
    title: "Speed Limit",
    content: <SpeedLimitLaw />,
  },
  {
    title: "Negative Space",
    content: <NegativeSpaceLaw />,
  },
  {
    title: "Viewing Angle",
    content: <ViewingAngleLaw />,
  },
];

export function LawsOfConjuryContent() {
  return (
    <VStack alignItems="flex-start" spacing={8} w="full" pb={8}>
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
          {law.content}
        </VStack>
      ))}
    </VStack>
  );
}
