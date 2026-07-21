import { observer } from "mobx-react-lite";
import { HStack, IconButton, Text } from "@chakra-ui/react";
import { RxAlignCenterHorizontally } from "react-icons/rx";
import { TbArrowBigRightLines } from "react-icons/tb";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { AudioControls } from "@/src/components/AudioControls";
import { AudioVolumeControls } from "@/src/components/AudioVolumeControls";
import { IntensitySlider } from "@/src/components/IntensitySlider";
import { BrightnessLimiterIndicator } from "@/src/components/BrightnessLimiterIndicator";
import { ControlGroup } from "@/src/components/ControlGroup";
import { FaMinus, FaPlus, FaShareAlt } from "react-icons/fa";
import { INITIAL_PIXELS_PER_SECOND } from "@/src/utils/time";
import {
  MAX_PIXELS_PER_SECOND,
  MIN_PIXELS_PER_SECOND,
} from "@/src/types/UIStore";

export const ExperienceEditorControls = observer(
  function ExperienceEditorControls() {
    const store = useStore();
    const { uiStore } = store;
    const zoomPercent = Math.round(
      (uiStore.pixelsPerSecond / INITIAL_PIXELS_PER_SECOND) * 100,
    );

    return (
      <HStack
        height={10}
        pl={2}
        py={2}
        spacing={1}
        overflowX="clip"
        borderColor="black"
      >
        <AudioControls />
        <IconButton
          aria-label="Zoom out"
          title="Zoom out"
          height={6}
          icon={<FaMinus size={12} />}
          onClick={action(() => uiStore.zoomOut())}
          isDisabled={uiStore.pixelsPerSecond <= MIN_PIXELS_PER_SECOND}
        />
        <Text
          fontSize="xs"
          minWidth="36px"
          textAlign="center"
          userSelect="none"
          title={`${uiStore.pixelsPerSecond.toFixed(0)} px/s`}
        >
          {zoomPercent}%
        </Text>
        <IconButton
          aria-label="Zoom in"
          title="Zoom in"
          height={6}
          icon={<FaPlus size={12} />}
          onClick={action(() => uiStore.zoomIn())}
          isDisabled={uiStore.pixelsPerSecond >= MAX_PIXELS_PER_SECOND}
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
        <AudioVolumeControls />
        <ControlGroup>
          <IntensitySlider />
          <BrightnessLimiterIndicator />
        </ControlGroup>
        {/* TODO: re implement given viewerMode */}
        <IconButton
          aria-label="Copy link to experience"
          title="Copy link to experience"
          height={6}
          icon={<FaShareAlt size={17} />}
          onClick={store.copyLinkToExperience}
        />
      </HStack>
    );
  },
);
