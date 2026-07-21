import { observer } from "mobx-react-lite";
import { Button, HStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { AudioVolumeControls } from "@/src/components/AudioVolumeControls";
import { IntensitySlider } from "@/src/components/IntensitySlider";
import { BrightnessLimiterIndicator } from "@/src/components/BrightnessLimiterIndicator";
import { ControlGroup } from "@/src/components/ControlGroup";
import { SendDataButton } from "@/src/components/SendDataButton";

export const EmceeOutputControls = observer(function EmceeOutputControls() {
  const store = useStore();
  const { uiStore } = store;

  if (uiStore.emceeOutputControlsMinimized) return null;

  return (
    <HStack
      height={10}
      pl={2}
      pr={2}
      py={2}
      spacing={1}
      borderBottomWidth={1}
      borderColor="black"
      bg="chakra-body-bg"
      overflowX="clip"
    >
      <AudioVolumeControls />
      <ControlGroup>
        <IntensitySlider />
        <BrightnessLimiterIndicator />
      </ControlGroup>
      <Button
        size="sm"
        height={6}
        minW={12}
        px={2}
        title="Render size (resolution) — click to cycle"
        aria-label="Cycle render target size"
        onClick={action(() => uiStore.nextRenderTextureSize())}
      >
        {uiStore.renderTargetSize}
      </Button>
      <SendDataButton />
    </HStack>
  );
});
