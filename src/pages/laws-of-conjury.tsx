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
        <Box
          h="100vh"
          w="100%"
          overflowY="auto"
          bgColor="gray.700"
          py={8}
          px={4}
        >
          <Box maxW="40rem" mx="auto" w="full" pb={8}>
            <Heading mb={8} textAlign="center">
              ✨ Laws of Conjury ✨
            </Heading>
            <LawsOfConjuryContent />
          </Box>
        </Box>
      </ChakraProvider>
    </>
  );
}
