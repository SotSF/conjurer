import { IconButton, VStack } from "@chakra-ui/react";
import { BsArrowsFullscreen } from "react-icons/bs";

type DisplayControlsProps = { canvasContainer: HTMLDivElement | null };

export const DisplayControls = function DisplayControls({
  canvasContainer,
}: DisplayControlsProps) {
  return (
    <VStack
      p={2}
      position="absolute"
      bottom={1}
      right={1}
      alignItems="flex-start"
      zIndex={1}
    >
      <IconButton
        aria-label="Go fullscreen"
        title="Go fullscreen"
        height={6}
        icon={<BsArrowsFullscreen size={15} />}
        onClick={() => canvasContainer?.requestFullscreen()}
      />
    </VStack>
  );
};
