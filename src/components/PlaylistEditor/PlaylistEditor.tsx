import {
  Button,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { PlaylistItem } from "@/src/components/PlaylistEditor/PlaylistItem";

export const PlaylistEditor = observer(function PlaylistEditor() {
  const store = useStore();
  const { playlistStore } = store;
  const { experienceFilenames } = playlistStore;

  return (
    <>
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
    </>
  );
});
