import {
  Button,
  Editable,
  EditableInput,
  EditablePreview,
  HStack,
  Table,
  TableContainer,
  Tbody,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { PlaylistItem } from "@/src/components/PlaylistEditor/PlaylistItem";
import { MdOutlinePlaylistAdd } from "react-icons/md";
import { FaRegClipboard } from "react-icons/fa";
import { action } from "mobx";
import { AddExperienceModal } from "@/src/components/PlaylistEditor/AddExperienceModal";
import { BiShuffle } from "react-icons/bi";

export const PlaylistEditor = observer(function PlaylistEditor() {
  const store = useStore();
  const { playlistStore, uiStore } = store;
  const { experienceNames } = playlistStore;

  const isEditable = store.context !== "viewer";

  return (
    <>
      <HStack justify="center" align="center">
        <Editable
          placeholder="Playlist name"
          value={playlistStore.name}
          onChange={action((value) => (playlistStore.name = value))}
          fontSize={20}
          fontWeight="bold"
          textAlign="center"
          isDisabled={!isEditable}
        >
          <EditablePreview />
          <EditableInput _placeholder={{ color: "gray.600" }} />
        </Editable>
        <Button
          ml={2}
          size="xs"
          variant="outline"
          onClick={action(
            () => (playlistStore.shuffle = !playlistStore.shuffle)
          )}
          leftIcon={<BiShuffle size={14} />}
          bgColor={playlistStore.shuffle ? "orange.600" : undefined}
          _hover={
            playlistStore.shuffle
              ? {
                  bgColor: "orange.600",
                }
              : undefined
          }
        >
          Shuffle
        </Button>
      </HStack>

      <VStack mb={4}></VStack>

      <TableContainer>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th isNumeric>#</Th>
              <Th>Experience name</Th>
            </Tr>
          </Thead>
          <Tbody>
            {experienceNames.map((experienceName, index) => (
              <Tr key={experienceName}>
                <PlaylistItem
                  experienceName={experienceName}
                  index={index}
                  playlistLength={experienceNames.length}
                  editable={isEditable}
                />
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      {isEditable && (
        <>
          <HStack justify="end" spacing={6}>
            <Button
              variant="link"
              size="sm"
              leftIcon={<FaRegClipboard size={17} />}
              onClick={() => playlistStore.copyToClipboard()}
            >
              Copy to clipboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<MdOutlinePlaylistAdd size={20} />}
              onClick={action(
                () => (uiStore.showingPlaylistAddExperienceModal = true)
              )}
            >
              Add experience
            </Button>
          </HStack>
          <Text mt={4} fontSize="sm" textAlign="center" color="gray.500">
            Note: playlists cannot currently be saved!
          </Text>
        </>
      )}
      <AddExperienceModal />
    </>
  );
});
