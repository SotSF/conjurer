import { observer } from "mobx-react-lite";
import { HStack, IconButton } from "@chakra-ui/react";
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from "react-icons/fa";
import { MAX_TIME } from "@/src/utils/time";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";

export const TimerControls = observer(function TimerControls() {
  const store = useStore();
  const { audioStore } = store;
  const playing = audioStore.audioState === "playing";

  return (
    <HStack width="100%" justify="center" py={2} spacing={1} overflowX="clip">
      <IconButton
        aria-label="Backward"
        title="Backward"
        height={6}
        bgColor="gray.600"
        icon={<FaStepBackward size={10} />}
        onClick={action(() => audioStore.setTimeWithCursor(0))}
      />
      <IconButton
        aria-label="Play"
        title="Play"
        color={playing ? "orange" : "green"}
        height={6}
        bgColor="gray.600"
        icon={playing ? <FaPause size={10} /> : <FaPlay size={10} />}
        onClick={action(store.togglePlaying)}
      />
      <IconButton
        aria-label="Forward"
        title="Forward"
        height={6}
        bgColor="gray.600"
        icon={<FaStepForward size={10} />}
        onClick={action(() => {
          audioStore.setTimeWithCursor(MAX_TIME);
          store.pause();
        })}
      />
    </HStack>
  );
});
