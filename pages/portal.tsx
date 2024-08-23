import { Store } from "@/src/types/Store";
import { StoreContext } from "@/src/types/StoreContext";
import { Box, ChakraProvider, theme } from "@chakra-ui/react";
import Head from "next/head";
import { ViewerPage } from "@/src/components/ViewerPage";

export default function Portal() {
  return (
    <>
      <Head>
        <title>Conjurer - Portal</title>
        <meta name="description" content="conjurer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <ChakraProvider theme={theme}>
        <StoreContext.Provider value={new Store("viewer")}>
          <Box height="100vh" width="100vw" bgColor="gray.700">
            <ViewerPage portalNarrative />
          </Box>
        </StoreContext.Provider>
      </ChakraProvider>
    </>
  );
}
