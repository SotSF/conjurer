import { observer } from "mobx-react-lite";
import { Flex, HStack, IconButton } from "@chakra-ui/react";
import { AudioSelector } from "@/src/components/AudioSelector";
import { AudioVolumeControls } from "@/src/components/AudioVolumeControls";
import { IntensitySlider } from "@/src/components/IntensitySlider";
import { BrightnessLimiterIndicator } from "@/src/components/BrightnessLimiterIndicator";
import { ControlGroup } from "@/src/components/ControlGroup";
import { ZoomControls } from "@/src/components/ZoomControls";
import { BeatMapControls } from "@/src/components/BeatMapControls";
import { RoleSelector } from "@/src/components/RoleSelector";
import { LoginButton } from "@/src/components/LoginButton";
import { BsSoundwave } from "react-icons/bs";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { hoverHelpProps } from "@/src/utils/hoverHelp";

export const ExperienceEditorControls = observer(
  function ExperienceEditorControls() {
    const store = useStore();
    const { uiStore } = store;

    return (
      <Flex
        w="100%"
        pl={2}
        pr={2}
        py={2}
        gap={2}
        alignItems="flex-start"
        borderColor="black"
      >
        <Flex flex={1} minW={0} flexWrap="wrap" alignItems="center" gap={1}>
          <AudioSelector />
          <AudioVolumeControls />
          <ControlGroup>
            <IntensitySlider />
            <BrightnessLimiterIndicator />
          </ControlGroup>
          <ZoomControls />
          <IconButton
            aria-label="Show waveform overlay"
            title="Show waveform overlay"
            height={6}
            icon={<BsSoundwave size={17} />}
            bgColor={uiStore.showingWaveformOverlay ? "orange.700" : undefined}
            _hover={
              uiStore.showingWaveformOverlay
                ? {
                    bgColor: "orange.600",
                  }
                : undefined
            }
            onClick={action(() => uiStore.toggleWaveformOverlay())}
            {...hoverHelpProps(
              uiStore,
              "Waveform overlay",
              "Draw the audio waveform over the timeline for visual alignment.",
            )}
          />
          <BeatMapControls />
        </Flex>
        <HStack spacing={1} flexShrink={0}>
          <RoleSelector />
          <LoginButton />
        </HStack>
      </Flex>
    );
  },
);
