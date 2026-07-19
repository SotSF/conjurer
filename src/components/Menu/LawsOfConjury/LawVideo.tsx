import { Box, BoxProps } from "@chakra-ui/react";

type LawVideoProps = BoxProps & {
  src: string;
};

export function LawVideo({
  src,
  w = "12rem",
  h = "12rem",
  ...props
}: LawVideoProps) {
  return (
    <Box
      as="video"
      src={src}
      autoPlay
      loop
      muted
      playsInline
      display="block"
      w={w}
      h={h}
      maxW="100%"
      borderRadius="md"
      objectFit="cover"
      {...props}
    />
  );
}
