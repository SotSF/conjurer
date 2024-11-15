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
import { action, runInAction } from "mobx";
import { AddExperienceModal } from "@/src/components/PlaylistEditor/AddExperienceModal";
import { BiShuffle } from "react-icons/bi";
import { ImLoop } from "react-icons/im";
import { trpc } from "@/src/utils/trpc";
import { PlaylistNameEditable } from "@/src/components/PlaylistEditor/PlaylistNameEditable";
import { useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { useRouter } from "next/router";

export const PlaylistEditor = observer(function PlaylistEditor() {
  const store = useStore();
  const { userStore, usingLocalData, playlistStore, uiStore } = store;
  const { username } = userStore;
  const { selectedPlaylist } = playlistStore;

  const isEditable = username === selectedPlaylist?.user.username;

  const { isPending, isError, data } = trpc.playlist.getPlaylist.useQuery(
    {
      usingLocalData,
      username,
      id: selectedPlaylist?.id!,
    },
    {
      enabled: selectedPlaylist !== null,
      staleTime: 1000 * 60 * 10,
    },
  );

  useEffect(() => {
    runInAction(() => {
      // this is very hacky and I hate it but it works
      if (data?.playlist) playlistStore.selectedPlaylist = data.playlist;
    });
  }, [playlistStore, data?.playlist]);

  useEffect(() => {
    if (!data?.playlistExperiences.length || store.experienceName) return;
    // once experiences are fetched, load the first experience in the playlist
    store.experienceStore.load(data.playlistExperiences[0].name);
  }, [store.experienceName, store.experienceStore, data?.playlistExperiences]);

  const router = useRouter();

  if (isPending || isError) return null;

  const { playlist, playlistExperiences } = data;

  return (
    <VStack m={6} justify="start" alignItems="start">
      <HStack justify="start" align="center" spacing={4}>
        <PlaylistNameEditable
          key={playlist.id + playlist.name}
          playlist={playlist}
          isEditable={isEditable}
        />
        <ButtonGroup isAttached size="xs" variant="outline">
          <Button
            onClick={action(
              () =>
                (playlistStore.shufflingPlaylist =
                  !playlistStore.shufflingPlaylist),
            )}
            leftIcon={<BiShuffle size={14} />}
            bgColor={playlistStore.shufflingPlaylist ? "orange.600" : undefined}
            _hover={
              playlistStore.shufflingPlaylist
                ? {
                    bgColor: "orange.600",
                  }
                : undefined
            }
          >
            Shuffle
          </Button>
          <Button
            onClick={action(
              () =>
                (playlistStore.loopingPlaylist =
                  !playlistStore.loopingPlaylist),
            )}
            leftIcon={<ImLoop size={14} />}
            bgColor={playlistStore.loopingPlaylist ? "orange.600" : undefined}
            _hover={
              playlistStore.loopingPlaylist
                ? {
                    bgColor: "orange.600",
                  }
                : undefined
            }
          >
            Loop all
          </Button>
        </ButtonGroup>
        <Button
          justifySelf="end"
          variant="solid"
          colorScheme="blue"
          size="sm"
          leftIcon={<FaPlus size={14} />}
          onClick={() => {
            store.role = "experience creator";
            router.push("/experience/untitled");
          }}
        >
          New experience
        </Button>
      </HStack>
      {playlist.description && (
        <HStack justify="start" align="center" spacing={4}>
          <Text fontSize="md" color="gray.400">
            {playlist.description}
            {/* TODO: make this editable */}
          </Text>
        </HStack>
      )}
      <HStack justify="start" align="center" spacing={4}>
        <Text fontSize="md" color="gray.400">
          {playlist.user.username} • {playlistExperiences.length} experiences
        </Text>
      </HStack>

      <TableContainer m={4}>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th isNumeric>#</Th>
              <Th>Experience</Th>
              <Th>Author</Th>
              <Th>Song</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {playlistExperiences.length === 0 ? (
              <>
                <Tr>
                  <Td>-</Td>
                  <Td>
                    <Text>No experiences added yet!</Text>
                  </Td>
                  <Td>-</Td>
                  <Td>-</Td>
                  <Td></Td>
                </Tr>
              </>
            ) : (
              playlistExperiences.map((experience, index) => (
                <Tr key={experience.id}>
                  <PlaylistItem
                    playlist={playlist}
                    experience={experience}
                    user={experience.user}
                    index={index}
                    playlistLength={playlistExperiences.length}
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
                () => (uiStore.showingPlaylistAddExperienceModal = true),
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
