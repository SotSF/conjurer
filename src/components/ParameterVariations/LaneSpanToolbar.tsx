import {
  Box,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Tooltip,
} from "@chakra-ui/react";
import { RefObject, useState } from "react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { TbChevronDown, TbCopy, TbRepeat, TbTrash } from "react-icons/tb";
import { Block } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { useLaneTimeScale } from "@/src/components/ParameterVariations/LaneTimeScaleContext";
import { nonSelectableUiProps } from "@/src/utils/nonSelectableUi";
import { allowedInsertTypes, InsertType } from "@/src/utils/regionConvert";
import { hoverHelpProps } from "@/src/utils/hoverHelp";

const TYPE_LABEL: Record<InsertType, string> = {
  curve: "Curve",
  lfo: "LFO",
  audio: "Audio",
  palette: "Palette",
  color: "Color",
};

const TYPE_HELP: Record<InsertType, string> = {
  curve: "Overwrite the selected span with a new Curve region.",
  lfo: "Overwrite the selected span with a new LFO region.",
  audio: "Overwrite the selected span with a new Audio region.",
  palette: "Overwrite the selected span with a new Palette region.",
  color: "Overwrite the selected span with a new Color region.",
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
  const [menuOpen, setMenuOpen] = useState(false);
  if (!span || !rect) return null;

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
        // Above sticky timeline chrome (headers ~11–18), below modals (1400)
        zIndex="dropdown"
        // the toolbar is an action bar, not part of the lane's drag surface
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        {...nonSelectableUiProps}
        {...hoverHelpProps(
          uiStore,
          "Lane span",
          "Actions for the selected time range on this automation lane.",
        )}
      >
        {insertTypes.length > 0 && (
          <Tooltip
            label="Replace span with a new region type"
            openDelay={0}
            hasArrow
            placement="top"
            fontSize="xs"
            isDisabled={menuOpen}
          >
            <Box
              as="span"
              display="inline-flex"
              {...hoverHelpProps(
                uiStore,
                "Replace with…",
                "Overwrite the selected span with a fresh region of the chosen type.",
              )}
            >
              <Menu
                placement="bottom-start"
                isLazy
                onOpen={() => setMenuOpen(true)}
                onClose={() => setMenuOpen(false)}
              >
                <MenuButton
                  as={Button}
                  size="xs"
                  height="16px"
                  minW="auto"
                  px="5px"
                  fontSize="9px"
                  variant="ghost"
                  color="#c3cdda"
                  rightIcon={<TbChevronDown size={10} />}
                  _hover={{ bg: "whiteAlpha.200", color: "#63b3ed" }}
                  _active={{ bg: "whiteAlpha.200", color: "#63b3ed" }}
                >
                  Replace
                </MenuButton>
                <Portal>
                  <MenuList minW="110px" bg="gray.700" py={1} zIndex="dropdown">
                    {insertTypes.map((type) => (
                      <MenuItem
                        key={type}
                        fontSize={11}
                        bg="gray.700"
                        _hover={{ bg: "gray.600" }}
                        onClick={action(() =>
                          store.replaceLaneSpanWithType(type),
                        )}
                        {...hoverHelpProps(
                          uiStore,
                          TYPE_LABEL[type],
                          TYPE_HELP[type],
                        )}
                      >
                        {TYPE_LABEL[type]}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Portal>
              </Menu>
            </Box>
          </Tooltip>
        )}
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
          "Delete span",
          "Erase the automation in the selected span, replacing it with a default region.",
          <TbTrash size={12} />,
          action(() => store.deleteLaneSpan()),
        )}
      </HStack>
    </Portal>
  );
});
