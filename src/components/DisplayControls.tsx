import { IconButton, VStack } from "@chakra-ui/react";
import { BsArrowsFullscreen } from "react-icons/bs";
import { FaCircleDot } from "react-icons/fa6";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";

type DisplayControlsProps = { canvasContainer: HTMLDivElement | null };

export const DisplayControls = function DisplayControls({
  canvasContainer,
}: DisplayControlsProps) {
  const { uiStore } = useStore();

  if (!canvasContainer) return null;
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
        variant="ghost"
        aria-label="Reset canopy view"
        title="Reset canopy view"
        height={6}
        icon={<FaCircleDot size={17} />}
        onClick={action(() => uiStore.canopyViewResetNonce++)}
      />
      <IconButton
        variant="ghost"
        aria-label="Go fullscreen"
        title="Go fullscreen"
        height={6}
        icon={<BsArrowsFullscreen size={15} />}
        onClick={() => canvasContainer.requestFullscreen()}
      />
    </VStack>
  );
};
