import { Box, ChakraProvider, theme } from "@chakra-ui/react";
import Head from "next/head";
import { useMemo } from "react";

import { Store } from "@/src/types/Store";
import { StoreContext } from "@/src/types/StoreContext";
import { VJPage } from "@/src/components/VJPage/VJPage";

export default function VJ() {
  // Use the same underlying store setup as the VJ/playground experience,
  // but render the VJ view UI.
  const store = useMemo(() => new Store("vj"), []);

  return (
    <>
      <Head>
        <title>Conjurer - VJ</title>
        <meta name="description" content="conjurer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <ChakraProvider theme={theme}>
        <StoreContext.Provider value={store}>
          <Box height="100vh" width="100vw" bgColor="gray.700">
            <VJPage />
          </Box>
        </StoreContext.Provider>
      </ChakraProvider>
    </>
  );
}

