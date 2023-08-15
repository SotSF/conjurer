import { Store } from "@/src/types/Store";
import { StoreContext } from "@/src/types/StoreContext";
import { Box, ChakraProvider, theme } from "@chakra-ui/react";
import Head from "next/head";
import { ControllerPage } from "@/src/components/ControllerPage";

export default function Controller() {
  return (
    <>
      <Head>
        <title>Conjurer - Controller</title>
        <meta name="description" content="conjurer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <ChakraProvider theme={theme}>
        <StoreContext.Provider value={new Store("controller")}>
          <Box height="100vh" width="100vw" bgColor="gray.700">
            <ControllerPage />
          </Box>
        </StoreContext.Provider>
      </ChakraProvider>
    </>
  );
}
