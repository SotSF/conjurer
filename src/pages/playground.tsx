import { Store } from "@/src/types/Store";
import { StoreContext } from "@/src/types/StoreContext";
import { Box, ChakraProvider, theme } from "@chakra-ui/react";
import Head from "next/head";
import { PlaygroundPage } from "@/src/components/PlaygroundPage";
import { useMemo } from "react";

export default function Playground() {
  const store = useMemo(() => new Store("playground"), []);
  return (
    <>
      <Head>
        <title>Conjurer - Playground</title>
        <meta name="description" content="conjurer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <ChakraProvider theme={theme}>
        <StoreContext.Provider value={store}>
          <Box height="100vh" width="100vw" bgColor="gray.700">
            <PlaygroundPage />
          </Box>
        </StoreContext.Provider>
      </ChakraProvider>
    </>
  );
}
