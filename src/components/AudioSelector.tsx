import { observer } from "mobx-react-lite";
import { IconButton, Select, Spinner } from "@chakra-ui/react";
import { AiOutlineCloudUpload } from "react-icons/ai";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { UploadAudioModal } from "@/src/components/UploadAudioModal";
import { trpc } from "@/src/utils/trpc";

export const AudioSelector = observer(function AudioSelector() {
  const store = useStore();
  const { uiStore, audioStore, usingLocalData } = store;

  const { isPending, data: songs } = trpc.song.listSongs.useQuery({
    usingLocalData,
  });

  if (isPending || !songs) {
    return <Spinner />;
  }

  return (
    <>
      <Select
        size="xs"
        width={40}
        value={audioStore.selectedAudioFile}
        onChange={action(
          (e) => (audioStore.selectedAudioFile = e.target.value)
        )}
      >
        {songs.map(({ artist, name, s3Path }) => (
          <option key={s3Path} value={s3Path}>
            {artist} - {name}
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
