import { IconButton, VStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { FaDotCircle } from "react-icons/fa";
import { TbLayoutRows, TbLayoutColumns, TbRectangle } from "react-icons/tb";
import { TbRectangleFilled } from "react-icons/tb";
import { AiOutlineLineChart } from "react-icons/ai";
import { DisplayMode } from "@/src/types/UIStore";
import { RiPlayList2Fill } from "react-icons/ri";
import { BsArrowsFullscreen, BsBagHeartFill } from "react-icons/bs";
import { trpcClient } from "@/src/utils/trpc";

type DisplayControlsProps = { canvasContainer: HTMLDivElement | null };

export const DisplayControls = observer(function DisplayControls({
  canvasContainer,
}: DisplayControlsProps) {
  const store = useStore();
  const { uiStore } = store;

  const displayModes: DisplayMode[] =
    store.context === "viewer"
      ? ["canopy", "cartesianSpace"]
      : ["canopy", "canopySpace", "cartesianSpace"];

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
      {store.context === "viewer" && (
        <IconButton
          aria-label="Show playlist"
          title="Show playlist"
          height={6}
          icon={<RiPlayList2Fill size={17} />}
          onClick={action(() => (uiStore.playlistDrawerOpen = true))}
        />
      )}
      {store.context !== "viewer" && (
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
      )}
      <VStack gap={0}>
        {displayModes.map((displayMode, index) => (
          <IconButton
            key={displayMode}
            aria-label={`Toggle ${displayMode}`}
            title={`Toggle ${displayMode}`}
            height={6}
            borderTopRadius={index === 0 ? undefined : 0}
            borderBottomRadius={
              index === displayModes.length - 1 ? undefined : 0
            }
            borderStyle="solid"
            borderColor="gray.400"
            borderTopWidth={index === 0 ? 0 : 0.5}
            borderBottomWidth={index === displayModes.length - 1 ? 0 : 0.5}
            icon={displayModeIcons[displayMode]}
            onClick={action(() => (uiStore.displayMode = displayMode))}
            bgColor={
              uiStore.displayMode === displayMode ? "orange.500" : undefined
            }
          />
        ))}
      </VStack>

      <IconButton
        aria-label="Render texture size"
        title="Render texture size"
        height={6}
        icon={<>{uiStore.renderTargetSize}</>}
        onClick={action(() => uiStore.nextRenderTextureSize())}
        fontSize="xs"
      />
      {store.context !== "viewer" && (
        <IconButton
          aria-label="Toggle performance"
          title="Toggle performance"
          height={6}
          icon={<AiOutlineLineChart size={17} />}
          onClick={action(() => uiStore.togglePerformance())}
        />
      )}
      <IconButton
        aria-label="Go fullscreen"
        title="Go fullscreen"
        height={6}
        icon={<BsArrowsFullscreen size={15} />}
        onClick={() => canvasContainer?.requestFullscreen()}
      />
      <IconButton
        aria-label="Print all users all users to console log"
        title="Print all users all users to console log"
        height={6}
        icon={<BsBagHeartFill size={15} />}
        onClick={async () => {
          console.log(await trpcClient.getAllUsers.query());
        }}
      />
    </VStack>
  );
});
