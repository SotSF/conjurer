import { observer } from "mobx-react-lite";
import {
  Button,
  ButtonGroup,
  HStack,
  IconButton,
  VStack,
} from "@chakra-ui/react";
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from "react-icons/fa";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { MdForward10, MdReplay10 } from "react-icons/md";

const PLAYBACK_RATES = [0.25, 0.5, 1] as const;

export const TimerControls = observer(function TimerControls() {
  const store = useStore();
  const { audioStore, playlistStore } = store;
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
          />
        </ButtonGroup>
      </HStack>
      {showSkipButtons && (
        <HStack width="100%" justify="center" overflowX="clip">
          <ButtonGroup isAttached>
            <IconButton
              borderStyle="solid"
              borderWidth={1}
              aria-label="Go back 10 seconds "
              title="Go back 10 seconds "
              height={6}
              bgColor="gray.600"
              icon={<MdReplay10 size={17} />}
              onClick={action(() => audioStore.skip(-10))}
            />
            <IconButton
              borderStyle="solid"
              borderWidth={1}
              aria-label="Go forward 10 seconds"
              title="Go forward 10 seconds"
              height={6}
              bgColor="gray.600"
              icon={<MdForward10 size={17} />}
              onClick={action(() => audioStore.skip(10))}
            />
          </ButtonGroup>
        </HStack>
      )}
      {showSkipButtons && (
        <HStack width="100%" justify="center" overflowX="clip">
          <ButtonGroup isAttached>
            {PLAYBACK_RATES.map((rate) => {
              const active = audioStore.playbackRate === rate;
              return (
                <Button
                  key={rate}
                  borderStyle="solid"
                  borderWidth={1}
                  aria-label={`Set playback speed to ${rate}x`}
                  title={`Set playback speed to ${rate}x`}
                  height={5}
                  minWidth={9}
                  px={2}
                  fontSize="xs"
                  color={active ? "green" : "white"}
                  bgColor={active ? "gray.500" : "gray.600"}
                  onClick={action(() => (audioStore.playbackRate = rate))}
                >
                  {rate}x
                </Button>
              );
            })}
          </ButtonGroup>
        </HStack>
      )}
    </VStack>
  );
});
