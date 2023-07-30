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
  const { experiences } = playlistStore;

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
            {experiences.map((experience, index) => (
              <Tr key={experience}>
                <PlaylistItemControls
                  experienceName={experience}
                  index={index}
                  playlistLength={experiences.length}
                />
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
});
