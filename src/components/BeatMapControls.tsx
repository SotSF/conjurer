import { observer } from "mobx-react-lite";
import { IconButton } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { RxColumns } from "react-icons/rx";
import { PiArrowsInLineHorizontalBold } from "react-icons/pi";
import { LoadBeatMapModal } from "@/src/components/LoadBeatMapModal";
import { RiFolderMusicLine } from "react-icons/ri";

export const BeatMapControls = observer(function BeatMapControls() {
  const store = useStore();
  const { uiStore } = store;

  return (
    <>
      <IconButton
        aria-label="Load beat map data"
        title="Load beat map data"
        height={6}
        icon={<RiFolderMusicLine size={17} />}
        onClick={action(() => (uiStore.showingLoadBeatMapModal = true))}
      />
      <IconButton
        aria-label="Show beat grid overlay"
        title="Show beat grid overlay"
        height={6}
        icon={<RxColumns size={17} />}
        bgColor={uiStore.showingBeatGridOverlay ? "orange.700" : undefined}
        _hover={
          uiStore.showingBeatGridOverlay
            ? {
                bgColor: "orange.600",
              }
            : undefined
        }
        onClick={action(() => uiStore.toggleBeatGridOverlay())}
      />
      <LoadBeatMapModal />
      <IconButton
        aria-label="Snap to grid"
        title="Snap to grid"
        height={6}
        icon={<PiArrowsInLineHorizontalBold size={17} />}
        bgColor={uiStore.snappingToBeatGrid ? "orange.700" : undefined}
        _hover={
          uiStore.snappingToBeatGrid
            ? {
                bgColor: "orange.600",
              }
            : undefined
        }
        onClick={action(() => uiStore.toggleSnappingToBeatGrid())}
      />
    </>
  );
});
