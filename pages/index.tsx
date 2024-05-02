import { Box, ChakraProvider, theme } from "@chakra-ui/react";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Secret Fire</title>
        <meta name="description" content="Servants of the Secret Fire" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <ChakraProvider theme={theme}>
        <Box height="100vh" width="100vw" bgColor="gray.700">
          <p>testing</p>
        </Box>
      </ChakraProvider>
    </>
  );
}
