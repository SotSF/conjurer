import { observer } from "mobx-react-lite";
import {
  IconButton,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Tooltip,
} from "@chakra-ui/react";
import { BsSoundwave } from "react-icons/bs";
import { FaVolumeMute } from "react-icons/fa";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { useState } from "react";
import { AudioSelector } from "@/src/components/AudioSelector";
import { BeatMapControls } from "@/src/components/BeatMapControls";

export const AudioControls = observer(function AudioControls() {
  const store = useStore();
  const { uiStore, audioStore } = store;
  const { wavesurfer } = audioStore;
  const [showTooltip, setShowTooltip] = useState(false);
  const [audioVol, setAudioVol] = useState(1);

  const changeVolume = (value: number) => {
    wavesurfer?.setVolume(value);
    setAudioVol(value);
  };

  return (
    <>
      <AudioSelector />
      <Slider
        aria-label="Audio volume"
        title="Audio volume"
        mx={2}
        min={0}
        max={1}
        step={0.01}
        value={audioVol}
        onChange={action((value) => changeVolume(value))}
        width="120px"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
        <Tooltip
          hasArrow
          bg="teal.500"
          color="white"
          placement="top"
          isOpen={showTooltip}
          label={`Audio volume: ${(audioVol * 100).toFixed(0)}%`}
        >
          <SliderThumb />
        </Tooltip>
      </Slider>

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
        aria-label="Show waveform overlay"
        title="Show waveform overlay"
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
      <BeatMapControls />
    </>
  );
});
