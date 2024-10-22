import { Store } from "@/src/types/Store";
import { StoreContext, useStore } from "@/src/types/StoreContext";
import {
  Box,
  ChakraProvider,
  IconButton,
  theme,
  VStack,
} from "@chakra-ui/react";
import Head from "next/head";
import { memo, useEffect, useMemo, useState } from "react";
import { trpcClient } from "@/src/utils/trpc";
import { observer } from "mobx-react-lite";

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
            <TursoTest />
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

const TursoTest = observer(function TursoTest() {
  const store = useStore();
  return (
    <VStack>
      <p>Turso test:</p>
      <IconButton
        aria-label="Use local assets"
        title="Use local assets"
        height={6}
        bgColor={store.usingLocalAssets ? "orange.700" : undefined}
        _hover={
          store.usingLocalAssets
            ? {
                bgColor: "orange.600",
              }
            : undefined
        }
        icon={
          <>
            {store.usingLocalAssets
              ? "using local assets"
              : "using prod assets"}
          </>
        }
        onClick={store.toggleUsingLocalAssets}
      />
      <IconButton
        aria-label="Use local database"
        title="Use local database"
        height={6}
        bgColor={store.usingLocalDatabase ? "orange.700" : undefined}
        _hover={
          store.usingLocalDatabase
            ? {
                bgColor: "orange.600",
              }
            : undefined
        }
        icon={
          <>
            {store.usingLocalDatabase
              ? "using local database"
              : "using prod database"}
          </>
        }
        onClick={store.toggleUsingLocalDatabase}
      />
      <IconButton
        aria-label="Print all users to console log"
        title="Print all users to console log"
        height={6}
        icon={<>Print users to console log</>}
        onClick={async () => {
          console.log(
            await trpcClient.getAllUsers.query({
              usingLocalDatabase: store.usingLocalDatabase,
            })
          );
        }}
      />
    </VStack>
  );
});
