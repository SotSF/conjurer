import { observer } from "mobx-react-lite";
import { IconButton, Select } from "@chakra-ui/react";
import { AiOutlineCloudUpload } from "react-icons/ai";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { UploadAudioModal } from "@/src/components/UploadAudioModal";
import { useEffect } from "react";

export const AudioSelector = observer(function AudioSelector() {
  const store = useStore();
  const { uiStore, audioStore, initializedClientSide } = store;

  useEffect(() => {
    if (!initializedClientSide) return;
    void audioStore.fetchAvailableAudioFiles();
  }, [audioStore, initializedClientSide]);

  return (
    <>
      <Select
        size="xs"
        width={40}
        value={audioStore.selectedAudioFile}
        onChange={action((e) => {
          audioStore.selectedAudioFile = e.target.value;
        })}
      >
        {audioStore.availableAudioFiles.map((audioFile) => (
          <option key={audioFile} value={audioFile}>
            {audioFile}
          </option>
        ))}
      </Select>
      <UploadAudioModal />
      <IconButton
        aria-label="Upload audio"
        title="Upload audio"
        height={6}
        icon={<AiOutlineCloudUpload size={17} />}
        isDisabled={store.usingLocalAssets}
        onClick={action(() => (uiStore.showingUploadAudioModal = true))}
      />
    </>
  );
});
