import { observer } from "mobx-react-lite";
import { HStack, IconButton } from "@chakra-ui/react";
import { RxAlignCenterHorizontally } from "react-icons/rx";
import { TbArrowBigRightLines } from "react-icons/tb";
import { BsSoundwave } from "react-icons/bs";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { AudioSelector } from "@/src/components/AudioSelector";
import { AudioVolumeControls } from "@/src/components/AudioVolumeControls";
import { IntensitySlider } from "@/src/components/IntensitySlider";
import { BrightnessLimiterIndicator } from "@/src/components/BrightnessLimiterIndicator";
import { ControlGroup } from "@/src/components/ControlGroup";
import { ZoomControls } from "@/src/components/ZoomControls";
import { BeatMapControls } from "@/src/components/BeatMapControls";
import { FaShareAlt } from "react-icons/fa";

export const ExperienceEditorControls = observer(
  function ExperienceEditorControls() {
    const store = useStore();
    const { uiStore } = store;

    return (
      <HStack
        height={10}
        pl={2}
        py={2}
        spacing={1}
        overflowX="clip"
        borderColor="black"
      >
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
        />
        <IconButton
          aria-label="Keep playhead centered"
          title="Keep playhead centered"
          height={6}
          bgColor={uiStore.keepingPlayHeadCentered ? "orange.700" : undefined}
          _hover={
            uiStore.keepingPlayHeadCentered
              ? {
                  bgColor: "orange.600",
                }
              : undefined
          }
          icon={<RxAlignCenterHorizontally size={17} />}
          onClick={action(
            () =>
              (uiStore.keepingPlayHeadCentered =
                !uiStore.keepingPlayHeadCentered),
          )}
        />
        <IconButton
          aria-label="Keep playhead visible"
          title="Keep playhead visible"
          height={6}
          bgColor={uiStore.keepingPlayHeadVisible ? "orange.700" : undefined}
          _hover={
            uiStore.keepingPlayHeadVisible
              ? {
                  bgColor: "orange.600",
                }
              : undefined
          }
          icon={<TbArrowBigRightLines size={17} />}
          onClick={action(
            () =>
              (uiStore.keepingPlayHeadVisible =
                !uiStore.keepingPlayHeadVisible),
          )}
        />
        <IconButton
          aria-label="Copy link to experience"
          title="Copy link to experience"
          height={6}
          icon={<FaShareAlt size={17} />}
          onClick={store.copyLinkToExperience}
        />
        <BeatMapControls />
      </HStack>
    );
  },
);
