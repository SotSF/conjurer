import { Block } from "@/src/types/Block";
import {
  Box,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Text,
} from "@chakra-ui/react";
import { action } from "mobx";
import { FiPlusSquare } from "react-icons/fi";
import { effects } from "@/src/effects/effects";
import { memo } from "react";

type Props = {
  block: Block;
  isSelected: boolean;
};

export const AddEffectButton = memo(function AddEffectButton({
  block,
  isSelected,
}: Props) {
  return (
    <Box
      width="100%"
      borderTopWidth={2}
      borderColor={isSelected ? "blue.500" : "white"}
      borderStyle="solid"
    >
      <Menu>
        <MenuButton as={Button} variant="ghost" width="100%" textAlign="center">
          <HStack
            userSelect="none"
            textOverflow="clip"
            overflowWrap="anywhere"
            justify="center"
          >
            <FiPlusSquare size={20} />
            <Text userSelect="none" textOverflow="clip" overflowWrap="anywhere">
              Add effect
            </Text>
          </HStack>
        </MenuButton>
        <Portal>
          <MenuList>
            {effects.map((effect) => (
              <MenuItem
                key={effect.name}
                onClick={action(() => block.addCloneOfEffect(effect))}
              >
                {effect.name}
              </MenuItem>
            ))}
          </MenuList>
        </Portal>
      </Menu>
    </Box>
  );
});
