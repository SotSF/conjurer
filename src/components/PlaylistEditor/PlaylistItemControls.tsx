import { HStack, IconButton, VStack } from "@chakra-ui/react";
import { RxCaretDown, RxCaretUp } from "react-icons/rx";
import { action } from "mobx";
import { FaTrashAlt } from "react-icons/fa";
import { memo } from "react";

type PlaylistItemControlsProps = {
  experienceName: string;
  index: number;
  playlistLength: number;
};

export const PlaylistItemControls = memo(function PlaylistItemControls({
  experienceName,
  index,
  playlistLength,
}: PlaylistItemControlsProps) {
  return (
    <>
      <HStack height={12} alignItems="center" spacing={0}>
        <VStack spacing={0}>
          {index > 0 && (
            <IconButton
              variant="link"
              aria-label="Move up"
              title="Move up"
              height={4}
              _hover={{ color: "blue.500" }}
              icon={<RxCaretUp size={28} />}
              onClick={action(() => {})}
            />
          )}
          {index < playlistLength && (
            <IconButton
              variant="link"
              aria-label="Move down"
              title="Move down"
              height={4}
              _hover={{ color: "blue.500" }}
              icon={<RxCaretDown size={28} />}
              onClick={action(() => {})}
            />
          )}
        </VStack>
        <IconButton
          variant="link"
          aria-label="Delete effect"
          title="Delete effect"
          height={6}
          _hover={{ color: "red.500" }}
          icon={<FaTrashAlt size={12} />}
          onClick={action(() => {})}
        />
      </HStack>
    </>
  );
});
