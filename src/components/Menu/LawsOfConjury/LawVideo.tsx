import { Box, BoxProps } from "@chakra-ui/react";

type LawVideoProps = BoxProps & {
  src: string;
};

export function LawVideo({ src, ...props }: LawVideoProps) {
  return (
    <Box
      as="video"
      src={src}
      autoPlay
      loop
      muted
      playsInline
      maxW="100%"
      borderRadius="md"
      {...props}
    />
  );
}
