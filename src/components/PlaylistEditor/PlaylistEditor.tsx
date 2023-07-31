import {
  Button,
  Checkbox,
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

export const PlaylistEditor = observer(function PlaylistEditor() {
  const store = useStore();
  const { playlistStore, uiStore } = store;
  const { experienceFilenames } = playlistStore;

  return (
    <>
      <Editable
        flexGrow={1}
        placeholder="Playlist name"
        value={playlistStore.name}
        onChange={action((value) => (playlistStore.name = value))}
        fontSize={20}
        fontWeight="bold"
        textAlign="center"
      >
        <EditablePreview />
        <EditableInput _placeholder={{ color: "gray.600" }} />
      </Editable>

      <VStack mb={4}>
        <Checkbox
          my={2}
          isChecked={playlistStore.autoplay}
          size="sm"
          onChange={({ target }) => (playlistStore.autoplay = target.checked)}
        >
          Autoplay next experience in playlist
        </Checkbox>
      </VStack>

      <TableContainer>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th isNumeric>#</Th>
              <Th>User</Th>
              <Th>Experience name</Th>
            </Tr>
          </Thead>
          <Tbody>
            {experienceFilenames.map((experienceFilename, index) => (
              <Tr key={experienceFilename}>
                <PlaylistItem
                  experienceFilename={experienceFilename}
                  index={index}
                  playlistLength={experienceFilenames.length}
                />
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
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
      <AddExperienceModal />
    </>
  );
});
