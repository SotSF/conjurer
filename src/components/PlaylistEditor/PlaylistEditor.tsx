import {
  Button,
  Checkbox,
  Table,
  TableContainer,
  Tbody,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { PlaylistItem } from "@/src/components/PlaylistEditor/PlaylistItem";
import { MdOutlinePlaylistAdd } from "react-icons/md";

export const PlaylistEditor = observer(function PlaylistEditor() {
  const store = useStore();
  const { playlistStore } = store;
  const { experienceFilenames } = playlistStore;

  return (
    <>
      <VStack>
        <Checkbox
          mb={2}
          isChecked={playlistStore.autoplay}
          onChange={({ target }) => (playlistStore.autoplay = target.checked)}
        >
          Autoplay next experience in playlist
        </Checkbox>
      </VStack>

      <TableContainer mt={6}>
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
      <VStack>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<MdOutlinePlaylistAdd size={20} />}
          onClick={() => {
            // TODO:
          }}
        >
          Add experience
        </Button>
      </VStack>
    </>
  );
});
