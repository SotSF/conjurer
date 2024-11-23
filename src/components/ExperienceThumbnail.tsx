import { Box } from "@chakra-ui/react";
import { Experience } from "@/src/types/Experience";
import Image from "next/image";
import { memo } from "react";

export const ExperienceThumbnail = memo(function ExperienceThumbnail({
  thumbnailURL,
  onClick,
}: {
  thumbnailURL: string;
  onClick?: () => void;
}) {
  if (!thumbnailURL) return null;
  return (
    <Box
      position="relative"
      cursor="pointer"
      width="32px"
      height="32px"
      onClick={onClick}
      _hover={{ opacity: 0.8 }}
      borderRadius="50%"
      overflow="hidden"
    >
      {/* Black circle where infinity mirror would be */}
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%,-50%)"
        width="7px"
        height="7px"
        borderRadius="50%"
        bgColor="#000000"
        zIndex={10}
      />
      <Image src={thumbnailURL} alt="thumbnail" width="32" height="32" />
    </Box>
  );
});
