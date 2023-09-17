import { observer } from "mobx-react-lite";
import {
  Box,
  HStack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { Fragment, useEffect, useRef, useState } from "react";
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
import { ScalarInput } from "@/src/components/ScalarInput";

type TempoCount = {
  tempo: number;
  count: number;
};

export const BeatMapperPage = observer(function BeatMapperPage() {
  const store = useStore();
  const { uiStore, audioStore, playlistStore } = store;

  const initialized = useRef(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  useWheelZooming(timelineRef.current);

  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [beats, setBeats] = useState<number[]>([]);
  const [tempoCounts, setTempoCounts] = useState<TempoCount[]>([]);
  const [threshold, setThreshold] = useState((0.8).toString());

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;

      runInAction(() => {
        playlistStore.experienceFilenames = ["joe-night-jar"];
      });
      store.initializeClientSide();
    }
  }, [store, playlistStore, uiStore]);

  useEffect(() => {
    audioStore.wavesurfer?.on("ready", () => {
      runInAction(() => {
        uiStore.pixelsPerSecond = 20;
      });
      const buffer = audioStore.wavesurfer!.getDecodedData()!;
      setAudioBuffer(buffer);
    });
  }, [audioStore.wavesurfer, audioStore.peaks, uiStore]);

  useEffect(() => {
    if (Number.isNaN(Number(threshold)) || !audioBuffer) return;

    // Create offline context
    var offlineContext = new OfflineAudioContext(
      1,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    // Create buffer source
    var source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

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
      const filteredPeaks = getPeaksAtThreshold(
        filteredBuffer.getChannelData(0),
        Number(threshold),
        filteredBuffer.sampleRate
      );

      const newBeats = filteredPeaks.map(
        (peakIndex) => peakIndex / filteredBuffer.sampleRate
      );
      setBeats(newBeats);

      const histogram = countIntervalsBetweenNearbyPeaks(filteredPeaks, 200);
      const newTempoCounts = groupNeighborsByTempo(
        histogram,
        filteredBuffer.sampleRate
      );

      // sort data by highest count
      const sortedTempoCounts = newTempoCounts.sort(
        (a, b) => b.count - a.count
      );
      setTempoCounts(sortedTempoCounts);
    };
  }, [threshold, audioBuffer]);

  const displayTempoCounts = [...tempoCounts].slice(0, 10);
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
      <VStack m={2}>
        <ScalarInput
          name="Threshold"
          value={`${threshold}`}
          onChange={(valueString, valueNumber) => setThreshold(valueString)}
          step={0.01}
        />

        <Text>
          <strong>Beats detected:</strong> {beats.length}
        </Text>
        <TableContainer>
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th isNumeric>Tempo (BPM)</Th>
                <Th isNumeric>Count</Th>
              </Tr>
            </Thead>
            <Tbody>
              {displayTempoCounts.map(({ tempo, count }, index) => (
                <Fragment key={index}>
                  <Tr>
                    <Td>
                      <span>{tempo.toFixed(2)}</span>
                    </Td>
                    <Td>
                      <span>{count}</span>
                    </Td>
                  </Tr>
                </Fragment>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </VStack>
    </>
  );
});
