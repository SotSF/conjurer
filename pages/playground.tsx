import { Store } from "@/src/types/Store";
import { StoreContext } from "@/src/types/StoreContext";
import { Box, ChakraProvider, theme } from "@chakra-ui/react";
import Head from "next/head";
import { PatternPlayground } from "@/src/components/PatternPlayground/PatternPlayground";

export default function Playground() {
  return (
    <>
      <Head>
        <title>Conjurer - Playground</title>
        <meta name="description" content="conjurer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <ChakraProvider theme={theme}>
        <StoreContext.Provider value={new Store()}>
          <Box
            height="100vh"
            width="100vw"
            bgColor="gray.700"
            padding={8}
            overflowY="scroll"
          >
            <PatternPlayground />
          </Box>
        </StoreContext.Provider>
      </ChakraProvider>
    </>
  );
}
