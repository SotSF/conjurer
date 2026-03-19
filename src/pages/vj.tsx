import { Box, ChakraProvider, theme, Text, VStack } from "@chakra-ui/react";
import Head from "next/head";
import { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";

import { Store } from "@/src/types/Store";
import { StoreContext, useStore } from "@/src/types/StoreContext";

const VJPlaceholder = observer(function VJPlaceholder() {
  const store = useStore();

  useEffect(() => {
    if (store.initializationState !== "uninitialized") return;
    void store.initializeClientSide();
  }, [store]);

  return (
    <Box p={8}>
      <VStack alignItems="flex-start" spacing={3}>
        <Text fontSize="2xl" fontWeight="bold">
          VJ view placeholder
        </Text>
        <Text color="gray.200">
          The full VJ UI will be added here. For pattern editing and the
          playground controls, use the editor drawer or the separate{" "}
          <Text as="span" color="white" textDecoration="underline">
            Pattern Playground
          </Text>
          .
        </Text>
      </VStack>
    </Box>
  );
});

export default function VJ() {
  // Use the same underlying store setup as the VJ/playground experience,
  // but render only a placeholder for now.
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
            <VJPlaceholder />
          </Box>
        </StoreContext.Provider>
      </ChakraProvider>
    </>
  );
}

