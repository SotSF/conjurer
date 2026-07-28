import { Box, Button } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { AiOutlinePlus } from "react-icons/ai";
import { observer } from "mobx-react-lite";
import { DEVICE_PANEL_HEIGHT } from "@/src/components/ExperienceEditor/BlockDevicePanel";
import { PARAMETER_DETAIL_PANEL_HEIGHT } from "@/src/components/ExperienceEditor/ParameterDetailPanel";
import { STATUS_INFO_BAR_HEIGHT } from "@/src/components/ExperienceEditor/StatusInfoBar";
import { hoverHelpProps } from "@/src/utils/hoverHelp";

export const AddPatternButton = observer(function AddPatternButton() {
  const store = useStore();
  const { uiStore } = store;

  // Lift above whichever bottom arrangement panel is open (detail swaps in
  // for the device panel), and always above the status info bar.
  const detailPanelOpen =
    store.context !== "viewer" &&
    uiStore.showParameterDetailPanel &&
    store.selectedParameter != null;
  const devicePanelOpen =
    store.context !== "viewer" &&
    uiStore.showDevicePanel &&
    !detailPanelOpen &&
    store.selectedBlocksOrVariations.size > 0;

  const bottomPanelHeight = detailPanelOpen
    ? PARAMETER_DETAIL_PANEL_HEIGHT
    : devicePanelOpen
      ? DEVICE_PANEL_HEIGHT
      : 0;
  const bottomOffset = STATUS_INFO_BAR_HEIGHT + bottomPanelHeight;

  return (
    <Box position="absolute" bottom={bottomOffset} right={0} m={6}>
      <Button
        variant="solid"
        bgColor="orange.500"
        _hover={{ backgroundColor: "orange.400" }}
        size="md"
        borderRadius={"full"}
        onClick={action(() => {
          store.pause();
          uiStore.patternDrawerOpen = true;
        })}
        zIndex={100}
        leftIcon={<AiOutlinePlus size={18} />}
        {...hoverHelpProps(
          uiStore,
          "Add pattern",
          "Open the pattern library to drop a new pattern onto the timeline.",
        )}
      >
        Pattern
      </Button>
    </Box>
  );
});
