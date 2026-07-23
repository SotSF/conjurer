import {
  Box,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Tooltip,
} from "@chakra-ui/react";
import { useState } from "react";
import { TbPlus } from "react-icons/tb";
import { InsertType } from "@/src/utils/regionConvert";

const LABEL: Record<InsertType, string> = {
  curve: "Curve",
  lfo: "LFO",
  audio: "Audio",
  palette: "Palette",
  color: "Color",
};

type Props = {
  // region types sensible for this param (numeric → curve/lfo/audio, palette →
  // palette, vec4 → color); the menu offers only these
  types: InsertType[];
  armedType: InsertType | null;
  setArmedType: (t: InsertType | null) => void;
  // notify the parent when the type menu opens/closes so it can keep the ＋
  // visible while the menu is up (the cursor leaves the lane onto the menu)
  onOpenChange?: (open: boolean) => void;
};

// The ＋ add-region control, rendered inline in the last region tab's control
// row (matching the reset/delete glyphs). Choosing a type arms a one-shot insert
// (paint or click the lane to place it, Esc to cancel); while armed it shows an
// active ＋ that cancels on click.
export const AddRegionMenu = ({
  types,
  armedType,
  setArmedType,
  onOpenChange,
}: Props) => {
  // track open state to suppress the tooltip while the menu is up (chakra keeps
  // a tooltip open while its trigger holds focus, which the open menu does)
  const [menuOpen, setMenuOpen] = useState(false);
  if (types.length === 0) return null;

  if (armedType)
    return (
      <Tooltip
        label={`Placing ${LABEL[armedType]} — click or drag the lane · Esc`}
        openDelay={0}
        hasArrow
        placement="top"
        fontSize="xs"
      >
        <Box
          as="span"
          display="flex"
          alignItems="center"
          cursor="pointer"
          color="#8fcbf5"
          onClick={(e) => {
            e.stopPropagation();
            setArmedType(null);
          }}
        >
          <TbPlus size={13} />
        </Box>
      </Tooltip>
    );

  return (
    <Tooltip
      label="Add region"
      openDelay={0}
      hasArrow
      placement="top"
      fontSize="xs"
      isDisabled={menuOpen}
    >
      <Box as="span" display="inline-flex" alignItems="center">
        <Menu
          placement="bottom-end"
          isLazy
          onOpen={() => {
            setMenuOpen(true);
            onOpenChange?.(true);
          }}
          onClose={() => {
            setMenuOpen(false);
            onOpenChange?.(false);
          }}
        >
          <MenuButton
            as="span"
            display="flex"
            alignItems="center"
            cursor="pointer"
            _hover={{ color: "#63b3ed" }}
            onClick={(e) => e.stopPropagation()}
          >
            <TbPlus size={13} />
          </MenuButton>
          <Portal>
            <MenuList minW="110px" bg="gray.700" py={1} zIndex={1600}>
              {types.map((t) => (
                <MenuItem
                  key={t}
                  fontSize={11}
                  bg="gray.700"
                  _hover={{ bg: "gray.600" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setArmedType(t);
                  }}
                >
                  {LABEL[t]}
                </MenuItem>
              ))}
            </MenuList>
          </Portal>
        </Menu>
      </Box>
    </Tooltip>
  );
};
