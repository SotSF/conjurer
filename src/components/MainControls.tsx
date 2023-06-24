import { observer } from "mobx-react-lite";
import { HStack, IconButton } from "@chakra-ui/react";
import { RiZoomInLine, RiZoomOutLine } from "react-icons/ri";
import { RxAlignCenterHorizontally } from "react-icons/rx";
import { TbArrowBigRightLines } from "react-icons/tb";
import { CiStreamOn, CiStreamOff } from "react-icons/ci";
import { GiDesert } from "react-icons/gi";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { AudioControls } from "@/src/components/AudioControls";
import { IntensitySlider } from "@/src/components/IntensitySlider";

export const MainControls = observer(function MainControls() {
  const store = useStore();
  const { uiStore } = store;

  return (
    <HStack height={10} py={2} spacing={1} overflowX="clip" borderColor="black">
      <AudioControls />
      <IconButton
        aria-label="Zoom in"
        title="Zoom in"
        height={6}
        icon={<RiZoomInLine size={17} />}
        onClick={action(() => uiStore.zoomIn())}
      />
      <IconButton
        aria-label="Zoom out"
        title="Zoom out"
        height={6}
        icon={<RiZoomOutLine size={17} />}
        onClick={action(() => uiStore.zoomOut())}
      />
      <IconButton
        aria-label="Send data to canopy"
        title="Send data to canopy"
        height={6}
        bgColor={store.sendingData ? "orange.700" : undefined}
        _hover={
          store.sendingData
            ? {
                bgColor: "orange.600",
              }
            : undefined
        }
        icon={
          store.sendingData ? (
            <CiStreamOn size={17} />
          ) : (
            <CiStreamOff size={17} />
          )
        }
        onClick={store.toggleSendingData}
      />
      <IconButton
        aria-label="Use local assets"
        title="Use local assets"
        height={6}
        bgColor={store.usingLocalAssets ? "orange.700" : undefined}
        _hover={
          store.usingLocalAssets
            ? {
                bgColor: "orange.600",
              }
            : undefined
        }
        icon={<GiDesert size={17} />}
        onClick={store.toggleUsingLocalAssets}
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
            (uiStore.keepingPlayHeadCentered = !uiStore.keepingPlayHeadCentered)
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
            (uiStore.keepingPlayHeadVisible = !uiStore.keepingPlayHeadVisible)
        )}
      />
      <IntensitySlider />
    </HStack>
  );
});
