import { observer } from "mobx-react-lite";
import { IconButton } from "@chakra-ui/react";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";

export const EmceeOutputControlsToggle = observer(
  function EmceeOutputControlsToggle() {
    const store = useStore();
    const { uiStore } = store;
    const minimized = uiStore.emceeOutputControlsMinimized;

    return (
      <IconButton
        position="absolute"
        bottom={2}
        left={2}
        zIndex={1}
        variant="ghost"
        aria-label={
          minimized ? "Expand output controls" : "Minimize output controls"
        }
        title={
          minimized ? "Expand output controls" : "Minimize output controls"
        }
        height={6}
        minW={6}
        icon={
          minimized ? <BsChevronUp size={14} /> : <BsChevronDown size={14} />
        }
        onClick={action(
          () =>
            (uiStore.emceeOutputControlsMinimized =
              !uiStore.emceeOutputControlsMinimized),
        )}
      />
    );
  },
);
