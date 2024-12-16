import { observer } from "mobx-react-lite";
import { IconButton, Select, Spinner } from "@chakra-ui/react";
import { AiOutlineCloudUpload } from "react-icons/ai";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { UploadAudioModal } from "@/src/components/UploadAudioModal";
import { trpc } from "@/src/utils/trpc";
import { NO_SONG, Song } from "@/src/types/Song";

export const AudioSelector = observer(function AudioSelector() {
  const store = useStore();
  const { uiStore, audioStore, usingLocalData } = store;

  const { isPending, data: songs } = trpc.song.listSongs.useQuery(
    { usingLocalData },
    { refetchOnWindowFocus: false },
  );

  if (isPending || !songs) {
    return <Spinner />;
  }

  const songsWithNoSongOption: Song[] = [NO_SONG, ...songs];
  return (
    <>
      <Select
        size="xs"
        width={40}
        value={audioStore.selectedSong.filename}
        onChange={action((e) => {
          audioStore.selectedSong = songsWithNoSongOption.find(
            (song) => song.filename === e.target.value,
          )!;
        })}
      >
        {songsWithNoSongOption.map((song) => (
          <option key={song.filename} value={song.filename}>
            {song.artist} - {song.name}
          </option>
        ))}
      </Select>
      <UploadAudioModal />
      <IconButton
        aria-label="Upload audio"
        title="Upload audio"
        height={6}
        icon={<AiOutlineCloudUpload size={17} />}
        onClick={action(() => (uiStore.showingUploadAudioModal = true))}
      />
    </>
  );
});
