import { IconButton, VStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { FaDotCircle } from "react-icons/fa";
import { TbLayoutRows, TbLayoutColumns, TbRectangle } from "react-icons/tb";
import { TbRectangleFilled } from "react-icons/tb";
import { AiOutlineLineChart } from "react-icons/ai";
import { DisplayMode } from "@/src/types/UIStore";

const displayModes: DisplayMode[] = ["canopy", "canopySpace", "cartesianSpace"];

export const DisplayControls = observer(function DisplayControls() {
  const store = useStore();
  const { uiStore } = store;

  const displayModeIcons: Record<DisplayMode, JSX.Element> = {
    canopy: <FaDotCircle size={17} />,
    canopySpace: <TbRectangleFilled size={17} />,
    cartesianSpace: <TbRectangle size={17} />,
    none: <TbRectangle size={17} />,
  };

  return (
    <VStack
      p={2}
      position="absolute"
      bottom={1}
      right={1}
      alignItems="flex-start"
      zIndex={1}
    >
      <IconButton
        aria-label="Toggle horizontal/vertical layout"
        title="Toggle horizontal/vertical layout"
        height={6}
        icon={
          uiStore.horizontalLayout ? (
            <TbLayoutColumns size={17} />
          ) : (
            <TbLayoutRows size={17} />
          )
        }
        onClick={action(() => uiStore.toggleLayout())}
      />
      {displayModes.map((displayMode) => (
        <IconButton
          key={displayMode}
          aria-label={`Toggle ${displayMode}`}
          title={`Toggle ${displayMode}`}
          height={6}
          icon={displayModeIcons[displayMode]}
          onClick={action(() => (uiStore.displayMode = displayMode))}
          bgColor={
            uiStore.displayMode === displayMode ? "orange.500" : undefined
          }
        />
      ))}
      <IconButton
        aria-label="Render texture size"
        title="Render texture size"
        height={6}
        icon={<>{uiStore.renderTargetSize}</>}
        onClick={action(() => uiStore.nextRenderTextureSize())}
        fontSize="xs"
      />
      <IconButton
        aria-label="Toggle performance"
        title="Toggle performance"
        height={6}
        icon={<AiOutlineLineChart size={17} />}
        onClick={action(() => uiStore.togglePerformance())}
      />
    </VStack>
  );
});
