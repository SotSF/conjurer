import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
} from "@chakra-ui/react";
import { memo } from "react";
import { FaCaretDown } from "react-icons/fa";
import { DisplayMode } from "@/src/types/UIStore";

const displayModeOptions = [
  { value: "canopy" as const, label: "Canopy" },
  { value: "cartesianSpace" as const, label: "Cartesian space" },
  { value: "canopySpace" as const, label: "Canopy space" },
  { value: "none" as const, label: "Don't render" },
] as const;

type Props = {
  displayMode: DisplayMode;
  onChange: (mode: DisplayMode) => void;
};

export const VJDisplayModeButtons = memo(function VJDisplayModeButtons({
  displayMode,
  onChange,
}: Props) {
  const selectedLabel =
    displayModeOptions.find((opt) => opt.value === displayMode)?.label ??
    displayMode;

  return (
    <Menu computePositionOnMount size="xs">
      <MenuButton
        as={Button}
        px={1}
        py={0}
        variant="ghost"
        size="xs"
        transition="all 0.2s"
        borderRadius="md"
        _hover={{ bg: "gray.500" }}
        _focus={{ boxShadow: "outline" }}
        rightIcon={<FaCaretDown />}
      >
        {selectedLabel}
      </MenuButton>
      <Portal>
        <MenuList zIndex="dropdown">
          {displayModeOptions.map((opt) => (
            <MenuItem key={opt.value} onClick={() => onChange(opt.value)}>
              {opt.label}
            </MenuItem>
          ))}
        </MenuList>
      </Portal>
    </Menu>
  );
});
