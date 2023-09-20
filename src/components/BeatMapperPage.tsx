import { observer } from "mobx-react-lite";
import {
  Box,
  HStack,
  Heading,
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
import { BeatGrid } from "@/src/components/BeatGrid";

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

  const [threshold, setThreshold] = useState((0.72).toFixed(2));
  const [frequency, setFrequency] = useState((150).toString());

  const [songTempo, setSongTempo] = useState((112).toFixed(4));
  const [songTempoOffset, setSongTempoOffset] = useState((0).toFixed(4));
  const songTempoNumber = Number(songTempo);
  const songTempoOffsetNumber = Number(songTempoOffset);

  const [selectedBeatIndex, setSelectedBeatIndex] = useState<number | null>(
    null
  );

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
        // uiStore.pixelsPerSecond = 80;
      });
      const buffer = audioStore.wavesurfer!.getDecodedData()!;
      setAudioBuffer(buffer);
    });
  }, [audioStore.wavesurfer, audioStore.peaks, uiStore]);

  useEffect(() => {
    if (
      Number.isNaN(Number(threshold)) ||
      Number.isNaN(Number(frequency)) ||
      !audioBuffer
    )
      return;

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
    filter.frequency.value = Number(frequency);

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
  }, [threshold, frequency, audioBuffer]);

  useEffect(() => {
    if (!audioBuffer || selectedBeatIndex == null) return;
    let timeOffset = beats[selectedBeatIndex];
    const beatInterval = 60 / songTempoNumber;
    while (timeOffset > 0) timeOffset -= beatInterval;
    timeOffset += beatInterval;

    setSongTempoOffset(timeOffset.toString());
  }, [selectedBeatIndex, beats, audioBuffer, songTempoNumber]);

  const displayTempoCounts = [...tempoCounts].slice(0, 20);

  return (
    <>
      <Box
        ref={timelineRef}
        position="relative"
        overflow="scroll"
        overscrollBehavior="none"
        bgColor="gray.500"
      >
        <HStack width={uiStore.timeToXPixels(MAX_TIME)} spacing={0} zIndex={12}>
          <VStack
            position="sticky"
            left={0}
            borderRightWidth={1}
            borderBottomWidth={1}
            borderColor="black"
            spacing={0}
            width="150px"
            flexShrink={0}
            bgColor="gray.500"
            zIndex={18}
          >
            <TimerControls />
            <TimerReadout />
          </VStack>
          <WavesurferWaveform />
        </HStack>

        <HStack
          width={uiStore.timeToXPixels(MAX_TIME)}
          height="50px"
          spacing={0}
          zIndex={12}
        >
          <VStack
            position="sticky"
            left={0}
            borderRightWidth={1}
            borderBottomWidth={1}
            borderColor="black"
            spacing={0}
            width="150px"
            height="100%"
            zIndex={18}
            bgColor="gray.500"
          >
            <Text textAlign="center" color="black">
              detected beats (click to align)
            </Text>{" "}
          </VStack>
          <Box position="relative" height="50px">
            {beats.map((beat, index) => (
              <Box
                key={index}
                position="absolute"
                top={0}
                left={uiStore.timeToXPixels(beat)}
                width="1px"
                height="100%"
                bgColor="white"
                cursor="pointer"
                onClick={() => setSelectedBeatIndex(index)}
              />
            ))}
          </Box>
        </HStack>

        <HStack
          width={uiStore.timeToXPixels(MAX_TIME)}
          height="50px"
          spacing={0}
          zIndex={12}
        >
          <VStack
            position="sticky"
            left={0}
            borderRightWidth={1}
            borderBottomWidth={1}
            borderColor="black"
            spacing={0}
            width="150px"
            height="100%"
            zIndex={18}
            bgColor="gray.500"
          >
            <Text textAlign="center" color="black">
              computed beats
            </Text>{" "}
          </VStack>
          <Box position="relative" height="50px">
            {/* <BeatGrid
              songTempo={songTempoNumber}
              songTempoOffset={songTempoOffsetNumber}
            /> */}
            {!Number.isNaN(songTempoOffsetNumber) &&
              !Number.isNaN(songTempoNumber) &&
              // TODO: make this number bigger and make this more efficient
              Array.from({ length: 100 }).map((_, index) => (
                <Box
                  key={index}
                  position="absolute"
                  top={0}
                  left={uiStore.timeToXPixels(
                    songTempoOffsetNumber + (index * 60) / songTempoNumber
                  )}
                  width="1px"
                  height="100%"
                  bgColor="red"
                />
              ))}
          </Box>
        </HStack>
      </Box>
      <VStack m={2} width="350px">
        <Heading size="sm">Beat computation</Heading>
        <ScalarInput
          name="Song tempo"
          value={songTempo}
          onChange={(valueString) => setSongTempo(valueString)}
          step={0.01}
        />
        <ScalarInput
          name="Song tempo offset"
          value={songTempoOffset}
          onChange={(valueString) => setSongTempoOffset(valueString)}
          step={0.01}
        />

        <Heading size="sm">Beat detection</Heading>
        <ScalarInput
          name="Lowpass cutoff frequency (Hz)"
          value={frequency}
          onChange={(valueString) => setFrequency(valueString)}
          step={50}
        />
        <ScalarInput
          name="Beat detection threshold"
          value={threshold}
          onChange={(valueString) => setThreshold(valueString)}
          step={0.01}
        />

        <Text>
          <strong>Total beats detected:</strong> {beats.length}
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
                      <Text
                        cursor="pointer"
                        _hover={{ textDecoration: "underline" }}
                        onClick={() => setSongTempo(tempo.toString())}
                      >
                        {tempo.toFixed(2)}
                      </Text>
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
