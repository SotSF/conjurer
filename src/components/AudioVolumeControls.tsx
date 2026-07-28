import { observer } from "mobx-react-lite";
import {
  IconButton,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Tooltip,
} from "@chakra-ui/react";
import { FaVolumeDown, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { useState } from "react";
import { ControlGroup } from "@/src/components/ControlGroup";
import { hoverHelpProps } from "@/src/utils/hoverHelp";

function volumeIcon(muted: boolean, volume: number) {
  if (muted || volume === 0) return <FaVolumeMute size={17} />;
  if (volume < 0.5) return <FaVolumeDown size={17} />;
  return <FaVolumeUp size={17} />;
}

export const AudioVolumeControls = observer(function AudioVolumeControls() {
  const store = useStore();
  const { audioStore, uiStore } = store;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <ControlGroup>
      <IconButton
        aria-label="Mute/unmute audio"
        title="Mute/unmute audio"
        variant="ghost"
        height={6}
        minW={6}
        icon={volumeIcon(audioStore.audioMuted, audioStore.audioVolume)}
        color={audioStore.audioMuted ? "orange.300" : undefined}
        onClick={action(() => audioStore.toggleAudioMuted())}
        {...hoverHelpProps(
          uiStore,
          "Mute audio",
          "Mute or unmute the experience soundtrack.",
        )}
      />
      <Slider
        aria-label="Audio volume"
        title="Audio volume"
        mx={1}
        min={0}
        max={1}
        step={0.01}
        value={audioStore.audioVolume}
        onChange={action((value) => (audioStore.audioVolume = value))}
        width="120px"
        onMouseEnter={action(() => {
          setShowTooltip(true);
          uiStore.setHoverHelp({
            title: "Audio volume",
            description: "Loudness of the experience soundtrack.",
          });
        })}
        onMouseLeave={action(() => {
          setShowTooltip(false);
          uiStore.clearHoverHelp();
        })}
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
          label={`Audio volume: ${(audioStore.audioVolume * 100).toFixed(0)}%`}
        >
          <SliderThumb />
        </Tooltip>
      </Slider>
    </ControlGroup>
  );
});
