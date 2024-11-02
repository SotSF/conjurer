import { IconButton, VStack } from "@chakra-ui/react";
import { BsArrowsFullscreen } from "react-icons/bs";

type DisplayControlsProps = { canvasContainer: HTMLDivElement | null };

export const DisplayControls = function DisplayControls({
  canvasContainer,
}: DisplayControlsProps) {
  return (
    <VStack
      p={1}
      position="absolute"
      bottom={2}
      right={0}
      alignItems="flex-start"
      zIndex={1}
    >
      <IconButton
        variant={"ghost"}
        aria-label="Go fullscreen"
        title="Go fullscreen"
        height={6}
        icon={<BsArrowsFullscreen size={15} />}
        onClick={() => canvasContainer?.requestFullscreen()}
      />
    </VStack>
  );
};
