import { Box, HStack, IconButton, Text, Tooltip } from "@chakra-ui/react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import {
  MouseEvent as ReactMouseEvent,
  ReactElement,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { MdClose, MdMyLocation } from "react-icons/md";
import {
  AutomationLane,
  Lane,
} from "@/src/components/TimelineBlockStack/BlockAutomationLanes";
import { LaneTimeScaleProvider } from "@/src/components/ParameterVariations/LaneTimeScaleContext";
import { useStore } from "@/src/types/StoreContext";
import { hoverHelpProps } from "@/src/utils/hoverHelp";

/** Bottom panel height — tall enough for a blown-up envelope editor. */
export const PARAMETER_DETAIL_PANEL_HEIGHT = 520;
const DETAIL_GRAPH_HEIGHT = 360;

/**
 * Ableton-style clip/detail view for one parameter: the same lane editor as the
 * timeline, fit to the panel width over the full block duration so fine curve
 * edits are practical. Opens from a lane's expand control; closes back to the
 * device panel.
 */
export const ParameterDetailPanel = observer(function ParameterDetailPanel() {
  const store = useStore();
  const { uiStore } = store;
  const selection = store.selectedParameter;
  const measureRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [selection?.block.id, selection?.uniformName]);

  if (!selection) return null;

  const { block, uniformName } = selection;
  const patternBlock = block.parentBlock ?? block;
  const laneDuration = patternBlock.duration;
  const param = block.pattern.params[uniformName];
  const label =
    block.parentBlock != null
      ? `${block.pattern.name} · ${param?.name ?? uniformName}`
      : (param?.name ?? uniformName);

  const lane: Lane = {
    ownerBlock: block,
    uniformName,
    label,
    isOpacity: uniformName === "u_opacity",
    laneDuration,
  };

  return (
    <Box
      height={`${PARAMETER_DETAIL_PANEL_HEIGHT}px`}
      bg="#12151c"
      borderTopWidth="1px"
      borderColor="#2d3748"
      px={2}
      py={1}
      position="relative"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Match BlockDevicePanel: overlay toolbar so it doesn't consume a row */}
      <HStack position="absolute" top="2px" right="4px" zIndex={1} spacing={0}>
        <PanelIconButton
          label="Scroll timeline to this block"
          helpDescription="Jump the timeline so this block is visible."
          icon={<MdMyLocation />}
          onClick={action(() => uiStore.scrollToTime(patternBlock.startTime))}
        />
        <PanelIconButton
          label="Close detail panel"
          helpDescription="Return to the device panel. The timeline lane stays open."
          icon={<MdClose />}
          onClick={action(() => {
            uiStore.showParameterDetailPanel = false;
          })}
        />
      </HStack>

      <HStack
        height="18px"
        flexShrink={0}
        spacing={2}
        align="center"
        pr="44px"
        mb={1}
      >
        <Text
          fontSize="11px"
          fontWeight={700}
          color="#e2e8f0"
          letterSpacing="0.02em"
          noOfLines={1}
        >
          {label}
        </Text>
        <Text fontSize="10px" color="#718096" flexShrink={0}>
          {laneDuration.toFixed(2)}s · full block
        </Text>
      </HStack>

      <Box ref={measureRef} flex="1" minH={0} minW={0} overflow="hidden">
        {width > 0 && (
          <LaneTimeScaleProvider width={width} duration={laneDuration}>
            <AutomationLane
              lane={lane}
              graphHeight={DETAIL_GRAPH_HEIGHT}
              embedded
            />
          </LaneTimeScaleProvider>
        )}
      </Box>
    </Box>
  );
});

// Same control chrome as BlockDevicePanel (locate / close).
const PanelIconButton = function PanelIconButton({
  label,
  helpDescription,
  icon,
  onClick,
}: {
  label: string;
  helpDescription?: string;
  icon: ReactElement;
  onClick: (e: ReactMouseEvent) => void;
}) {
  const { uiStore } = useStore();
  return (
    <Tooltip label={label} openDelay={0} hasArrow fontSize="xs">
      <IconButton
        aria-label={label}
        icon={icon}
        size="xs"
        height="18px"
        minW="18px"
        variant="ghost"
        color="#63b3ed"
        flexShrink={0}
        onClick={onClick}
        {...hoverHelpProps(uiStore, label, helpDescription)}
      />
    </Tooltip>
  );
};
