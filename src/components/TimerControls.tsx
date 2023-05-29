import { observer } from "mobx-react-lite";
import { HStack, IconButton } from "@chakra-ui/react";
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from "react-icons/fa";
import { MAX_TIME } from "@/src/utils/time";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";

export const TimerControls = observer(function TimerControls() {
  const { timer } = useStore();

  return (
    <HStack
      width="100%"
      justify="center"
      py={2}
      spacing={1}
      overflowX="clip"
      borderColor="black"
    >
      <IconButton
        aria-label="Backward"
        title="Backward"
        height={6}
        icon={<FaStepBackward size={10} />}
        onClick={action(() => timer.setTime(0))}
      />
      <IconButton
        aria-label="Play"
        title="Play"
        color={timer.playing ? "orange" : "green"}
        height={6}
        icon={timer.playing ? <FaPause size={10} /> : <FaPlay size={10} />}
        onClick={action(timer.togglePlaying)}
      />
      <IconButton
        aria-label="Forward"
        title="Forward"
        height={6}
        icon={<FaStepForward size={10} />}
        onClick={action(() => {
          timer.setTime(MAX_TIME);
          timer.playing = false;
        })}
      />
    </HStack>
  );
});
