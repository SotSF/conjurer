import {
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
} from "@chakra-ui/react";
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
};

// The ＋ region affordance in the lane's hover controls. Choosing a type arms a
// one-shot insert of that type (paint or click the lane to place it, Esc to
// cancel). While armed it shows a status chip that also cancels on click.
export const AddRegionMenu = ({ types, armedType, setArmedType }: Props) => {
  if (types.length === 0) return null;

  if (armedType)
    return (
      <HStack
        spacing={1}
        bg="rgba(15,17,21,.9)"
        borderRadius="3px"
        px="5px"
        py="1px"
        cursor="pointer"
        title="Cancel insert"
        onClick={(e) => {
          e.stopPropagation();
          setArmedType(null);
        }}
      >
        <Text fontSize="9px" color="#8fcbf5" whiteSpace="nowrap">
          insert {LABEL[armedType]} — click lane · Esc
        </Text>
      </HStack>
    );

  return (
    <Menu placement="bottom-end" isLazy>
      <Tooltip
        label="Add region"
        openDelay={0}
        hasArrow
        placement="top"
        fontSize="xs"
      >
        <MenuButton
          as={IconButton}
          variant="unstyled"
          size="xs"
          height={5}
          minW={5}
          aria-label="Add region"
          icon={<TbPlus size={14} />}
          color="gray.300"
          _hover={{ color: "blue.300" }}
          onClick={(e) => e.stopPropagation()}
        />
      </Tooltip>
      <MenuList minW="110px" bg="gray.700" py={1}>
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
    </Menu>
  );
};
