import { LawsOfConjuryContent } from "@/src/components/Menu/LawsOfConjuryContent";
import { Box, ChakraProvider, Heading, theme } from "@chakra-ui/react";
import Head from "next/head";

export default function LawsOfConjury() {
  return (
    <>
      <Head>
        <title>Conjurer - Laws of Conjury</title>
        <meta name="description" content="Laws of Conjury" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <ChakraProvider theme={theme}>
        <Box height="100vh" width="100vw" bgColor="gray.700" p={8}>
          <Heading mb={8}>✨ Laws of Conjury ✨</Heading>
          <LawsOfConjuryContent />
        </Box>
      </ChakraProvider>
    </>
  );
}
