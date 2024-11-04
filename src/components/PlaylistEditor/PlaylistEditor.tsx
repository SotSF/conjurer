import {
  Button,
  ButtonGroup,
  HStack,
  Table,
  TableContainer,
  Tbody,
  Td,
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
import { action } from "mobx";
import { AddExperienceModal } from "@/src/components/PlaylistEditor/AddExperienceModal";
import { BiShuffle } from "react-icons/bi";
import { ImLoop } from "react-icons/im";
import { trpc } from "@/src/utils/trpc";
import { PlaylistNameEditable } from "@/src/components/PlaylistEditor/PlaylistNameEditable";

export const PlaylistEditor = observer(function PlaylistEditor() {
  const store = useStore();
  const { usingLocalData, playlistStore, uiStore } = store;

  const isEditable = !!store.username;

  const { isPending, isError, data } = trpc.playlist.getPlaylist.useQuery(
    {
      usingLocalData,
      id: playlistStore.selectedPlaylistId!,
    },
    {
      enabled: playlistStore.selectedPlaylistId !== null,
    }
  );

  if (isPending || isError) return null;

  const { playlist, experiences } = data;

  return (
    <VStack m={6} justify="start" alignItems="start" flexBasis="70rem">
      <HStack justify="start" align="center" spacing={4}>
        <PlaylistNameEditable
          key={playlist.id + playlist.name}
          playlist={playlist}
          isEditable={isEditable}
        />
        <ButtonGroup isAttached size="xs" variant="outline">
          <Button
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
          <Button
            onClick={action(() => (playlistStore.loop = !playlistStore.loop))}
            leftIcon={<ImLoop size={14} />}
            bgColor={playlistStore.shuffle ? "orange.600" : undefined}
            _hover={
              playlistStore.loop
                ? {
                    bgColor: "orange.600",
                  }
                : undefined
            }
          >
            Loop all
          </Button>
        </ButtonGroup>
      </HStack>
      <HStack justify="start" align="center" spacing={4}>
        <Text fontSize="md" color="gray.400">
          {playlist.user.username} • {experiences.length} experiences
        </Text>
      </HStack>

      <TableContainer m={4}>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th isNumeric>#</Th>
              <Th>Experience</Th>
              <Th>Song</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {experiences.length === 0 ? (
              <>
                <Tr>
                  <Td>-</Td>
                  <Td>
                    <Text>No experiences added yet!</Text>
                  </Td>
                </Tr>
              </>
            ) : (
              experiences.map((experience, index) => (
                <Tr key={experience.id}>
                  <PlaylistItem
                    playlist={playlist}
                    experience={experience}
                    index={index}
                    playlistLength={experiences.length}
                    editable={isEditable}
                  />
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {isEditable && (
        <>
          <HStack justify="end" spacing={6}>
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
        </>
      )}
      <AddExperienceModal playlist={playlist} />
    </VStack>
  );
});
