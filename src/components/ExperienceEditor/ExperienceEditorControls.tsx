import { observer } from "mobx-react-lite";
import { HStack, IconButton } from "@chakra-ui/react";
import { RiZoomInLine, RiZoomOutLine } from "react-icons/ri";
import { HiZoomIn, HiZoomOut } from "react-icons/hi";
import { RxAlignCenterHorizontally } from "react-icons/rx";
import { TbArrowBigRightLines } from "react-icons/tb";
import { RiPlayList2Fill } from "react-icons/ri";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { AudioControls } from "@/src/components/AudioControls";
import { IntensitySlider } from "@/src/components/IntensitySlider";
import { SendDataButton } from "@/src/components/SendDataButton";
import { FaCamera, FaShareAlt } from "react-icons/fa";

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
        <AudioControls />
        <IconButton
          aria-label="Zoom way in"
          title="Zoom way in"
          height={6}
          icon={<RiZoomInLine size={17} />}
          onClick={action(() => uiStore.zoomIn(50))}
        />
        <IconButton
          aria-label="Zoom in"
          title="Zoom in"
          height={6}
          icon={<HiZoomIn size={17} />}
          onClick={action(() => uiStore.zoomIn())}
        />
        <IconButton
          aria-label="Zoom out"
          title="Zoom out"
          height={6}
          icon={<HiZoomOut size={17} />}
          onClick={action(() => uiStore.zoomOut())}
        />
        <IconButton
          aria-label="Zoom way out"
          title="Zoom way out"
          height={6}
          icon={<RiZoomOutLine size={17} />}
          onClick={action(() => uiStore.zoomOut(50))}
        />
        <SendDataButton />
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
        <IntensitySlider />
        <IconButton
          aria-label="Copy link to experience"
          title="Copy link to experience"
          height={6}
          icon={<FaShareAlt size={17} />}
          onClick={store.copyLinkToExperience}
        />
        <IconButton
          aria-label="Capture thumbnail"
          title="Capture thumbnail"
          height={6}
          icon={<FaCamera size={17} />}
          onClick={action(() => (uiStore.capturingThumbnail = true))}
        />
      </HStack>
    );
  },
);
