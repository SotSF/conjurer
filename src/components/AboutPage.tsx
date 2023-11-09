import { Box, Heading } from "@chakra-ui/react";
import { memo, useEffect, useRef } from "react";

export const AboutPage = memo(function AboutPage() {
  // const store = useStore();
  const didInitialize = useRef(false);
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    // store.initializeClientSide();
  }, []);

  return (
    <Box position="relative" w="100vw" h="100vh">
      <Heading>About</Heading>
      <p>blah blah blah,</p>
      <p>blah blah</p>
    </Box>
  );
});
