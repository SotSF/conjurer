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
import { PlaylistItemControls } from "@/src/components/PlaylistEditor/PlaylistItemControls";

export const PlaylistEditor = observer(function PlaylistEditor() {
  const store = useStore();
  const { playlistStore } = store;
  const { experienceFilenames } = playlistStore;

  return (
    <>
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th isNumeric>#</Th>
              <Th>Experience name</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {experienceFilenames.map((experienceFilename, index) => (
              <Tr key={experienceFilename}>
                <PlaylistItemControls
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
