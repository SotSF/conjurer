import { observer } from "mobx-react-lite";
import { Box, HStack, VStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useEffect, useRef, useState } from "react";
import { WavesurferWaveform } from "@/src/components/Wavesurfer/WavesurferWaveform";
import { MAX_TIME } from "@/src/utils/time";
import { TimerReadout } from "@/src/components/TimerReadout";
import { TimerControls } from "@/src/components/TimerControls";
import { useWheelZooming } from "@/src/hooks/wheelZooming";
import {
  countIntervalsBetweenNearbyPeaks,
  getPeaksAtThreshold,
  groupNeighborsByTempo,
} from "@/src/utils/audio";
import { runInAction } from "mobx";

export const Test = observer(function Test() {
  const store = useStore();
  const { uiStore, audioStore, playlistStore } = store;
  const timelineRef = useRef<HTMLDivElement>(null);

  useWheelZooming(timelineRef.current);

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;

      runInAction(() => {
        playlistStore.experienceFilenames = ["joe-night-jar"];
      });
      store.initializeClientSide();
    }
  }, [store, playlistStore, uiStore]);

  const [beats, setBeats] = useState<number[]>([]);

  useEffect(() => {
    audioStore.wavesurfer?.on("ready", () => {
      runInAction(() => {
        uiStore.pixelsPerSecond = 20;
      });
      const buffer = audioStore.wavesurfer!.getDecodedData()!;
      console.log("buffer", buffer);
      // Create offline context
      var offlineContext = new OfflineAudioContext(
        1,
        buffer.length,
        buffer.sampleRate
      );

      // Create buffer source
      var source = offlineContext.createBufferSource();
      source.buffer = buffer;

      // Create filter
      var filter = offlineContext.createBiquadFilter();
      filter.type = "lowpass";
      console.log("filter frequency", filter.frequency);

      // Pipe the song into the filter, and the filter into the offline context
      source.connect(filter);
      filter.connect(offlineContext.destination);

      // Schedule the song to start playing at time:0
      source.start(0);

      // Render the song
      offlineContext.startRendering();

      // Act on the result
      offlineContext.oncomplete = function (e) {
        // Filtered buffer!
        var filteredBuffer = e.renderedBuffer;
        console.log("filteredBuffer", filteredBuffer);
        const filteredPeaks = getPeaksAtThreshold(
          filteredBuffer.getChannelData(0),
          0.8,
          filteredBuffer.sampleRate
        );
        console.log("filteredPeaks", filteredPeaks);

        const newBeats = filteredPeaks.map(
          (peakIndex) => peakIndex / filteredBuffer.sampleRate
        );
        setBeats(newBeats);
        const histogram = countIntervalsBetweenNearbyPeaks(filteredPeaks, 200);
        // console.log("histogram", histogram);

        const bpmCounts = groupNeighborsByTempo(
          histogram,
          filteredBuffer.sampleRate
        );
        console.log("bpmCounts", bpmCounts);

        // sort data by highest count
        const sorted = bpmCounts.sort((a, b) => b.count - a.count);
        console.log("sorted", sorted);
      };
    });
  }, [audioStore.wavesurfer, audioStore.peaks, uiStore]);

  return (
    <>
      <VStack
        position="sticky"
        top={0}
        left={0}
        flexShrink={0}
        boxSizing="border-box"
        borderRightWidth={1}
        borderBottomWidth={1}
        borderColor="black"
        spacing={0}
        width="150px"
        zIndex={18}
        bgColor="gray.500"
      >
        <TimerControls />
        <TimerReadout />
      </VStack>
      <Box
        ref={timelineRef}
        position="relative"
        height="100%"
        overflow="scroll"
        overscrollBehavior="none"
      >
        <HStack
          position="sticky"
          top={0}
          width={uiStore.timeToXPixels(MAX_TIME)}
          spacing={0}
          zIndex={12}
        >
          <WavesurferWaveform />
        </HStack>
        <HStack
          position="sticky"
          top={0}
          width={uiStore.timeToXPixels(MAX_TIME)}
          spacing={0}
          zIndex={12}
        >
          <Box position="relative" height="100px">
            {beats.map((beat, index) => (
              <Box
                key={index}
                position="absolute"
                top={0}
                left={uiStore.timeToXPixels(beat)}
                width="1px"
                height="100px"
                bgColor="white"
              />
            ))}
          </Box>
        </HStack>
      </Box>
    </>
  );
});
