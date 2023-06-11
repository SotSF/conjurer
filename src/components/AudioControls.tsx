import { observer } from "mobx-react-lite";
import { IconButton, Select } from "@chakra-ui/react";
import { BsSoundwave } from "react-icons/bs";
import { FaVolumeMute } from "react-icons/fa";
import { AiOutlineCloudUpload } from "react-icons/ai";
import { ImLoop } from "react-icons/im";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { UploadAudioModal } from "@/src/components/UploadAudioModal";
import { useEffect } from "react";

export const AudioControls = observer(function AudioControls() {
  const store = useStore();
  const { uiStore, audioStore } = store;

  useEffect(() => void audioStore.fetchAvailableAudioFiles(), [audioStore]);

  return (
    <>
      <IconButton
        aria-label="Loop time range"
        title="Loop time range"
        height={6}
        icon={<ImLoop size={17} />}
        bgColor={audioStore.audioLooping ? "orange.700" : undefined}
        _hover={
          audioStore.audioLooping
            ? {
                bgColor: "orange.600",
              }
            : undefined
        }
        onClick={action(() => audioStore.toggleAudioLooping())}
      />
      <IconButton
        aria-label="Mute/unmute audio"
        title="Mute/unmute audio"
        height={6}
        icon={<FaVolumeMute size={17} />}
        bgColor={audioStore.audioMuted ? "orange.700" : undefined}
        _hover={
          audioStore.audioMuted
            ? {
                bgColor: "orange.600",
              }
            : undefined
        }
        onClick={action(() => audioStore.toggleAudioMuted())}
      />
      <IconButton
        aria-label="Toggle waveform style"
        title="Toggle waveform style"
        height={6}
        icon={<BsSoundwave size={17} />}
        bgColor={uiStore.showingWaveformOverlay ? "orange.700" : undefined}
        _hover={
          uiStore.showingWaveformOverlay
            ? {
                bgColor: "orange.600",
              }
            : undefined
        }
        onClick={action(() => uiStore.toggleWaveformOverlay())}
      />
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
      <IconButton
        aria-label="Upload audio"
        title="Upload audio"
        height={6}
        icon={<AiOutlineCloudUpload size={17} />}
        onClick={action(() => (uiStore.showingUploadAudioModal = true))}
      />
      <UploadAudioModal />
    </>
  );
});
