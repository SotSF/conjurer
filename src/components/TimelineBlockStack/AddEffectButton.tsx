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
import { playgroundEffects } from "@/src/effects/effects";
import { HeaderRepeat } from "@/src/components/TimelineBlockStack/HeaderRepeat";
import { observer } from "mobx-react-lite";

type Props = {
  block: Block;
  isSelected: boolean;
};

export const AddEffectButton = observer(function AddEffectButton({
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
      <Menu placement="bottom">
        <MenuButton
          as={Button}
          variant="ghost"
          width="100%"
          textAlign="center"
          px={0}
        >
          <HStack
            userSelect="none"
            textOverflow="clip"
            overflowWrap="anywhere"
            justify="space-evenly"
          >
            <HeaderRepeat times={block.headerRepetitions}>
              <FiPlusSquare size={20} />
              <Text
                userSelect="none"
                textOverflow="clip"
                overflowWrap="anywhere"
              >
                Add effect
              </Text>
            </HeaderRepeat>
          </HStack>
        </MenuButton>
        <Portal>
          <MenuList rootProps={{ style: { zIndex: 12 } }}>
            {playgroundEffects.map((effect) => (
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
