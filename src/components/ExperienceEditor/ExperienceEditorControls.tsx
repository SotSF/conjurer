import { observer } from "mobx-react-lite";
import { Flex, HStack } from "@chakra-ui/react";
import { AudioSelector } from "@/src/components/AudioSelector";
import { AudioVolumeControls } from "@/src/components/AudioVolumeControls";
import { IntensitySlider } from "@/src/components/IntensitySlider";
import { BrightnessLimiterIndicator } from "@/src/components/BrightnessLimiterIndicator";
import { ControlGroup } from "@/src/components/ControlGroup";
import { ZoomControls } from "@/src/components/ZoomControls";
import { BeatMapControls } from "@/src/components/BeatMapControls";
import { RoleSelector } from "@/src/components/RoleSelector";
import { LoginButton } from "@/src/components/LoginButton";

export const ExperienceEditorControls = observer(
  function ExperienceEditorControls() {
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
