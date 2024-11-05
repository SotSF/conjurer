import { observer } from "mobx-react-lite";
import { Box } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useRef } from "react";
import { useWheelZooming } from "@/src/hooks/wheelZooming";
import { TimerAndWaveform } from "@/src/components/Timeline/TimerAndWaveform";
import { TimelineLayerStack } from "@/src/components/Timeline/TimelineLayerStack";

export const Timeline = observer(function Timeline() {
  const store = useStore();
  const timelineRef = useRef<HTMLDivElement>(null);

  useWheelZooming(timelineRef.current);

  return (
    <Box
      ref={timelineRef}
      position="relative"
      height="100%"
      overflow="scroll"
      overscrollBehavior="none"
    >
      <TimerAndWaveform />
      {store.context !== "viewer" && <TimelineLayerStack />}
    </Box>
  );
});
