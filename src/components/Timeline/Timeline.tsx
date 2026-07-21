import { observer } from "mobx-react-lite";
import { Box } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useState } from "react";
import { useWheelZooming } from "@/src/hooks/wheelZooming";
import { TimerAndWaveform } from "@/src/components/Timeline/TimerAndWaveform";
import { TimelineLayerStack } from "@/src/components/Timeline/TimelineLayerStack";

export const Timeline = observer(function Timeline() {
  const store = useStore();
  const [timelineEl, setTimelineEl] = useState<HTMLDivElement | null>(null);

  useWheelZooming(timelineEl);

  return (
    <Box
      id="timeline"
      ref={setTimelineEl}
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
