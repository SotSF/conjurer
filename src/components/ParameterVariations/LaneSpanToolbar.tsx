import { Box, Button, HStack, Portal, Text, Tooltip } from "@chakra-ui/react";
import { RefObject } from "react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { TbCopy, TbRepeat, TbX } from "react-icons/tb";
import { Block } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { useLaneTimeScale } from "@/src/components/ParameterVariations/LaneTimeScaleContext";
import { allowedInsertTypes, InsertType } from "@/src/utils/regionConvert";
import { hoverHelpProps } from "@/src/utils/hoverHelp";

const TYPE_LABEL: Record<InsertType, string> = {
  curve: "Curve",
  lfo: "LFO",
  audio: "Audio",
  palette: "Palette",
  color: "Color",
};

const TOOLBAR_HEIGHT = 22;
const GAP = 4;

type Props = {
  block: Block;
  uniformName: string;
  /** The lane body, which the toolbar is positioned against. */
  laneRef: RefObject<HTMLDivElement>;
};

/**
 * Actions for the selected lane span, floating just above it: replace the span
 * with a fresh region of a given type, copy it, or repeat it. Rendered in a
 * Portal with viewport coordinates so it escapes the lane's clipping and paints
 * over neighboring lanes (same approach as the curve node editor).
 */
export const LaneSpanToolbar = observer(function LaneSpanToolbar({
  block,
  uniformName,
  laneRef,
}: Props) {
  const store = useStore();
  const { uiStore } = store;
  const scale = useLaneTimeScale();
  const span = store.laneSpan;
  const rect = laneRef.current?.getBoundingClientRect();
  if (!span || !rect) return null;

  const duration = span.endTime - span.startTime;
  const left = rect.left + scale.timeToX(span.startTime);
  const top = rect.top - TOOLBAR_HEIGHT - GAP;

  const insertTypes = allowedInsertTypes(block.pattern.params[uniformName]);

  const iconButton = (
    label: string,
    description: string,
    icon: React.ReactElement,
    onClick: () => void,
  ) => (
    <Tooltip label={label} openDelay={0} hasArrow placement="top" fontSize="xs">
      <Box
        as="span"
        display="inline-flex"
        cursor="pointer"
        color="#c3cdda"
        _hover={{ color: "#63b3ed" }}
        onClick={onClick}
        {...hoverHelpProps(uiStore, label, description)}
      >
        {icon}
      </Box>
    </Tooltip>
  );

  return (
    <Portal>
      <HStack
        position="fixed"
        left={`${left}px`}
        top={`${top}px`}
        height={`${TOOLBAR_HEIGHT}px`}
        spacing="6px"
        px="6px"
        bg="gray.800"
        borderRadius="sm"
        boxShadow="md"
        zIndex={1500}
        // the toolbar is an action bar, not part of the lane's drag surface
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        {...hoverHelpProps(
          uiStore,
          "Lane span",
          "Actions for the selected time range on this automation lane.",
        )}
      >
        <Text fontFamily="mono" fontSize="9px" color="gray.400">
          {`${parseFloat(duration.toFixed(2))}s`}
        </Text>
        {insertTypes.map((type) => (
          <Tooltip
            key={type}
            label={`Replace span with a new ${TYPE_LABEL[type]} region`}
            openDelay={0}
            hasArrow
            placement="top"
            fontSize="xs"
          >
            <Button
              size="xs"
              height="16px"
              minW="auto"
              px="5px"
              fontSize="9px"
              variant="ghost"
              color="#c3cdda"
              _hover={{ bg: "whiteAlpha.200", color: "#63b3ed" }}
              onClick={action(() => store.replaceLaneSpanWithType(type))}
              {...hoverHelpProps(
                uiStore,
                `Replace with ${TYPE_LABEL[type]}`,
                `Overwrite the selected span with a new ${TYPE_LABEL[type]} region.`,
              )}
            >
              {TYPE_LABEL[type]}
            </Button>
          </Tooltip>
        ))}
        {iconButton(
          "Copy span",
          "Copy the selected span to the clipboard (⌘C also works).",
          <TbCopy size={12} />,
          () => store.copyLaneSpanToSystemClipboard(),
        )}
        {iconButton(
          "Repeat span",
          "Duplicate the selection immediately after itself.",
          <TbRepeat size={12} />,
          action(() => store.duplicateLaneSpan()),
        )}
        {iconButton(
          "Clear selection",
          "Deselect the lane span without changing the regions.",
          <TbX size={12} />,
          action(() => store.clearLaneSpan()),
        )}
      </HStack>
    </Portal>
  );
});
