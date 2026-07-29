import { observer } from "mobx-react-lite";
import {
  ButtonGroup,
  HStack,
  IconButton,
  Select,
  VStack,
} from "@chakra-ui/react";
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from "react-icons/fa";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { MdForward10, MdReplay10 } from "react-icons/md";
import { hoverHelpProps } from "@/src/utils/hoverHelp";

const PLAYBACK_RATES = [1, 0.5, 0.25] as const;

export const TimerControls = observer(function TimerControls() {
  const store = useStore();
  const { audioStore, playlistStore, uiStore } = store;
  const playing = audioStore.audioState === "playing";
  const showSkipButtons = store.context === "experienceEditor";

  return (
    <VStack pb={1} spacing={0}>
      <HStack width="100%" justify="center" overflowX="clip">
        <ButtonGroup isAttached>
          <IconButton
            borderStyle="solid"
            borderWidth={1}
            aria-label={
              store.context === "playlistEditor"
                ? "Go to previous"
                : "Go to start"
            }
            title={
              store.context === "playlistEditor"
                ? "Go to previous"
                : "Go to start"
            }
            height={6}
            bgColor="gray.600"
            icon={<FaStepBackward size={12} />}
            onClick={() => playlistStore.playPreviousExperience()}
            {...hoverHelpProps(
              uiStore,
              store.context === "playlistEditor"
                ? "Previous experience"
                : "Go to start",
              store.context === "playlistEditor"
                ? "Jump to the previous experience in the playlist."
                : "Seek the playhead back to the beginning.",
            )}
          />
          <IconButton
            borderStyle="solid"
            borderWidth={1}
            aria-label="Play"
            title="Play"
            color={playing ? "orange" : "green"}
            height={6}
            bgColor="gray.600"
            icon={playing ? <FaPause size={12} /> : <FaPlay size={12} />}
            onClick={action(store.togglePlaying)}
            {...hoverHelpProps(
              uiStore,
              playing ? "Pause" : "Play",
              "Toggle playback. Shortcut: Space.",
            )}
          />
          <IconButton
            borderStyle="solid"
            borderWidth={1}
            aria-label={
              store.context === "playlistEditor" ? "Go to next" : "Go to end"
            }
            title={
              store.context === "playlistEditor" ? "Go to next" : "Go to end"
            }
            height={6}
            bgColor="gray.600"
            icon={<FaStepForward size={12} />}
            onClick={() => playlistStore.playNextExperience()}
            {...hoverHelpProps(
              uiStore,
              store.context === "playlistEditor"
                ? "Next experience"
                : "Go to end",
              store.context === "playlistEditor"
                ? "Jump to the next experience in the playlist."
                : "Seek the playhead to the end of the timeline.",
            )}
          />
        </ButtonGroup>
      </HStack>
      {showSkipButtons && (
        <HStack width="100%" justify="center" overflowX="clip" spacing={1}>
          <ButtonGroup isAttached>
            <IconButton
              borderStyle="solid"
              borderWidth={1}
              aria-label="Go back 10 seconds "
              title="Go back 10 seconds "
              height={6}
              minWidth={7}
              bgColor="gray.600"
              icon={<MdReplay10 size={17} />}
              onClick={action(() => audioStore.skip(-10))}
              {...hoverHelpProps(
                uiStore,
                "Skip back 10s",
                "Jump the playhead backward by ten seconds.",
              )}
            />
            <IconButton
              borderStyle="solid"
              borderWidth={1}
              aria-label="Go forward 10 seconds"
              title="Go forward 10 seconds"
              height={6}
              minWidth={7}
              bgColor="gray.600"
              icon={<MdForward10 size={17} />}
              onClick={action(() => audioStore.skip(10))}
              {...hoverHelpProps(
                uiStore,
                "Skip forward 10s",
                "Jump the playhead forward by ten seconds.",
              )}
            />
          </ButtonGroup>
          <Select
            aria-label="Playback speed"
            title="Playback speed"
            size="xs"
            width="16"
            height={6}
            borderStyle="solid"
            borderWidth={1}
            bgColor="gray.600"
            borderRadius="md"
            iconSize="14px"
            value={audioStore.playbackRate}
            onChange={action((e) => {
              audioStore.playbackRate = Number(e.target.value);
            })}
            {...hoverHelpProps(
              uiStore,
              "Playback speed",
              "Slow down playback for precise timing work.",
            )}
          >
            {PLAYBACK_RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate}×
              </option>
            ))}
          </Select>
        </HStack>
      )}
    </VStack>
  );
});
