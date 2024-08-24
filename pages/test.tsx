import { Store } from "@/src/types/Store";
import { StoreContext } from "@/src/types/StoreContext";
import { Box, ChakraProvider, theme } from "@chakra-ui/react";
import Head from "next/head";
import { memo, useEffect, useMemo, useState } from "react";

export default function Test() {
  // Note: currently the store is not used on this page, only in the iframe
  const store = useMemo(() => new Store("viewer"), []);
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized) setInitialized(true);
  }, [initialized]);

  return (
    <>
      <Head>
        <title>Conjurer - Test Page</title>
        <meta name="description" content="conjurer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <ChakraProvider theme={theme}>
        <StoreContext.Provider value={store}>
          <Box height="100vh" width="100vw" bgColor="gray.700" p={2}>
            <p>Embedded conjurer test:</p>
            {initialized && <EmbedTest />}
          </Box>
        </StoreContext.Provider>
      </ChakraProvider>
    </>
  );
}

const EmbedTest = memo(function EmbedTest() {
  return (
    <iframe
      width="800"
      height="675"
      src={`${window.location.origin}/viewer?experience=joe-night-jar&embedded=true`}
      title="Conjurer"
      allow="autoplay; fullscreen"
      allowFullScreen
    />
  );
});
