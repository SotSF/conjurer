import { AdminPageContent } from "@/src/components/Admin/AdminPageContent";
import { Store } from "@/src/types/Store";
import { StoreContext } from "@/src/types/StoreContext";
import { Box, ChakraProvider, Heading, Link, Text, theme } from "@chakra-ui/react";
import Head from "next/head";
import { useEffect, useMemo } from "react";

export default function Admin() {
  const store = useMemo(() => new Store("playlistEditor"), []);

  useEffect(() => {
    if (store.initializationState !== "uninitialized") return;
    store.initializeClientSide();
  }, [store, store.initializationState]);

  return (
    <>
      <Head>
        <title>Conjurer - Admin</title>
        <meta name="description" content="Conjurer admin tools" />
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
          <Box maxW="48rem" mx="auto" w="full" pb={8}>
            <Heading mb={2}>Admin</Heading>
            <Text mb={8} color="gray.400" fontSize="sm">
              Internal tools for inspecting song assets.{" "}
              <Link href="/" color="blue.300">
                Back to Conjurer
              </Link>
            </Text>
            <StoreContext.Provider value={store}>
              <AdminPageContent />
            </StoreContext.Provider>
          </Box>
        </Box>
      </ChakraProvider>
    </>
  );
}
