import {
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
} from "@chakra-ui/react";
import { action } from "mobx";
import { MdAutoFixHigh } from "react-icons/md";
import { playgroundEffects } from "@/src/effects/effects";
import { EffectTrack } from "@/src/types/EffectTrack";
import { useStore } from "@/src/types/StoreContext";
import { hoverHelpProps } from "@/src/utils/hoverHelp";

type Props = {
  track: EffectTrack;
  helpTitle: string;
  helpDescription: string;
};

// Appends an effect from the registry to a post-composite effect track. The
// effect lands on the timeline at the playhead, where it can be moved and
// resized like any other block.
export const AddTrackEffectMenu = function AddTrackEffectMenu({
  track,
  helpTitle,
  helpDescription,
}: Props) {
  const { uiStore } = useStore();
  return (
    <Menu>
      <MenuButton
        as={IconButton}
        minW="20px"
        w="20px"
        h="20px"
        flexShrink={0}
        variant="unstyled"
        color="gray.600"
        _hover={{ color: "blue.600" }}
        display="flex"
        alignItems="center"
        justifyContent="center"
        aria-label={helpTitle}
        title={helpTitle}
        icon={<MdAutoFixHigh size={13} />}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        {...hoverHelpProps(uiStore, helpTitle, helpDescription)}
      />
      <Portal>
        {/* above the sticky timeline headers and the timer/waveform row */}
        <MenuList
          rootProps={{ style: { zIndex: 20 } }}
          maxH="300px"
          overflowY="auto"
        >
          {playgroundEffects.map((effect) => (
            <MenuItem
              key={effect.name}
              onClick={action(() => {
                track.addCloneOfEffect(effect);
              })}
            >
              {effect.name}
            </MenuItem>
          ))}
        </MenuList>
      </Portal>
    </Menu>
  );
};
