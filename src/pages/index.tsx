import { PlaylistEditorPage } from "@/src/components/PlaylistEditor/PlaylistEditorPage";
import { Store } from "@/src/types/Store";
import { StoreContext } from "@/src/types/StoreContext";
import { ChakraProvider, theme } from "@chakra-ui/react";
import Head from "next/head";
import { useMemo } from "react";

export default function Home() {
  const store = useMemo(() => new Store("playlistEditor"), []);
  return (
    <>
      <Head>
        <title>Conjurer</title>
        <meta name="description" content="conjurer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <ChakraProvider theme={theme}>
        <StoreContext.Provider value={store}>
          <PlaylistEditorPage />
        </StoreContext.Provider>
      </ChakraProvider>
    </>
  );
}
