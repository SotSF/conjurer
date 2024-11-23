import { Box, HStack } from "@chakra-ui/react";
import Image from "next/image";
import { memo } from "react";
import { FaCamera } from "react-icons/fa";

export const ExperienceThumbnail = memo(function ExperienceThumbnail({
  thumbnailURL,
  onClick,
  captureButton = false,
}: {
  thumbnailURL: string;
  onClick?: () => void;
  captureButton?: boolean;
}) {
  if (!thumbnailURL && !captureButton) return null;
  return (
    <Box
      position="relative"
      width="32px"
      height="32px"
      borderRadius="50%"
      overflow="hidden"
      cursor={onClick ? "pointer" : undefined}
      _hover={onClick ? { opacity: 0.8 } : undefined}
      onClick={onClick}
    >
      {!thumbnailURL && captureButton && (
        <HStack justify="center" width="100%" height="100%">
          <FaCamera size={13} />
        </HStack>
      )}
      {thumbnailURL && (
        <>
          {/* Black circle where infinity mirror would be */}
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%,-50%)"
            width="6px"
            height="6px"
            bgColor="#000000"
            zIndex={10}
          />
          <Image src={thumbnailURL} alt="thumbnail" width="32" height="32" />
        </>
      )}
    </Box>
  );
});
