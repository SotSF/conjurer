import { observer } from "mobx-react-lite";
import {
  Badge,
  Button,
  Divider,
  HStack,
  IconButton,
  NumberInput,
  NumberInputField,
  Text,
  VStack,
} from "@chakra-ui/react";
import { action } from "mobx";
import { useRef, useState } from "react";
import { useStore } from "@/src/types/StoreContext";
import { BeatGrid } from "@/src/types/BeatGrid";
import { TempoAlignmentStrip } from "@/src/components/BeatGrid/TempoAlignmentStrip";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";

const NUDGE_SECONDS = 0.005;
/**
 * Detection margin above which the tempo is unambiguous. Below it the runner-up
 * — nearly always half or double — scored close enough to be worth a listen,
 * which is what the ×2 and ÷2 buttons are for.
 */
const CLEAR_DETECTION = 0.2;
// Taps further apart than this are a new attempt, not a slow tempo.
const TAP_RESET_SECONDS = 2;
const MIN_TAPS = 4;

type Tap = { wallTime: number; songTime: number };

/** Least-squares slope of value against index. */
const slopePerIndex = (values: number[]) => {
  const n = values.length;
  const meanIndex = (n - 1) / 2;
  const meanValue = values.reduce((sum, value) => sum + value, 0) / n;
  let covariance = 0;
  let variance = 0;
  values.forEach((value, index) => {
    covariance += (index - meanIndex) * (value - meanValue);
    variance += (index - meanIndex) * (index - meanIndex);
  });
  return variance === 0 ? 0 : covariance / variance;
};

export const TempoPanel = observer(function TempoPanel() {
  const store = useStore();
  const { audioStore, beatGridStore } = store;
  const { grid, analysisState } = beatGridStore;

  const [bpmText, setBpmText] = useState("");
  const taps = useRef<Tap[]>([]);
  const [tapCount, setTapCount] = useState(0);

  const displayedBpm = bpmText || grid.trailingBpm.toFixed(2);

  const commitBpm = action((value: string) => {
    setBpmText(value);
    const bpm = Number(value);
    if (Number.isFinite(bpm) && bpm > 0)
      beatGridStore.setGrid(grid.withTrailingBpm(bpm));
  });

  const nudge = action((seconds: number) =>
    beatGridStore.setGrid(grid.withTimeShift(seconds)),
  );

  const scaleTempo = action((factor: number) => {
    setBpmText("");
    beatGridStore.setGrid(grid.withTempoScaled(factor));
  });

  const tap = action(() => {
    const wallTime = performance.now() / 1000;
    // The user reacts to what they hear, which trails the playhead by the
    // configured output latency, so the beat they tapped is that far back.
    const songTime = audioStore.globalTime - audioStore.audioLatency;

    const previous = taps.current[taps.current.length - 1];
    if (previous && wallTime - previous.wallTime > TAP_RESET_SECONDS)
      taps.current = [];
    taps.current.push({ wallTime, songTime });
    setTapCount(taps.current.length);

    if (taps.current.length < MIN_TAPS) return;

    // Wall clock for tempo (exact), song time for phase (what we need to
    // align to). Regressing over every tap averages out human jitter.
    const interval = slopePerIndex(taps.current.map((entry) => entry.wallTime));
    if (!(interval > 0)) return;
    const bpm = 60 / interval;

    const songTimes = taps.current.map((entry) => entry.songTime);
    const songInterval = slopePerIndex(songTimes);
    const meanSongTime =
      songTimes.reduce((sum, value) => sum + value, 0) / songTimes.length;
    const firstBeatTime = meanSongTime - songInterval * (songTimes.length - 1) / 2;

    const secondsPerBeat = 60 / bpm;
    const offset =
      firstBeatTime - Math.floor(firstBeatTime / secondsPerBeat) * secondsPerBeat;

    setBpmText("");
    beatGridStore.setGrid(
      BeatGrid.constant(bpm, offset, {
        beatsPerBar: grid.beatsPerBar,
        downbeat: grid.downbeat,
        source: "manual",
        confidence: 1,
      }),
    );
  });

  const reanalyze = action(async () => {
    const audioBuffer = audioStore.wavesurfer?.getDecodedData();
    if (!audioBuffer) return;
    setBpmText("");
    await beatGridStore.reanalyze(audioBuffer, audioStore.selectedSong);
  });

  const offsetMs = Math.round(grid.offset * 1000);
  const anchorIndexAtPlayhead = grid.anchorIndexNear(audioStore.globalTime, 0.25);

  return (
    <VStack align="stretch" spacing={3} p={1}>
      <TempoAlignmentStrip />

      <HStack>
        <Text fontSize="xs" width="70px" flexShrink={0}>
          {grid.isConstant ? "Tempo" : "Tempo (last)"}
        </Text>
        <NumberInput
          size="xs"
          step={0.01}
          value={displayedBpm}
          onChange={commitBpm}
          onBlur={() => setBpmText("")}
        >
          <NumberInputField />
        </NumberInput>
        <Button size="xs" onClick={() => scaleTempo(2)}>
          ×2
        </Button>
        <Button size="xs" onClick={() => scaleTempo(0.5)}>
          ÷2
        </Button>
      </HStack>

      <HStack>
        <Text fontSize="xs" width="70px" flexShrink={0}>
          Offset
        </Text>
        <IconButton
          aria-label="Nudge grid earlier"
          size="xs"
          icon={<AiOutlineMinus />}
          onClick={() => nudge(-NUDGE_SECONDS)}
        />
        <Text fontSize="xs" width="60px" textAlign="center">
          {offsetMs} ms
        </Text>
        <IconButton
          aria-label="Nudge grid later"
          size="xs"
          icon={<AiOutlinePlus />}
          onClick={() => nudge(NUDGE_SECONDS)}
        />
        <Button size="xs" onClick={tap} flexGrow={1}>
          {tapCount > 0 && tapCount < MIN_TAPS
            ? `Tap (${tapCount}/${MIN_TAPS})`
            : "Tap tempo"}
        </Button>
      </HStack>

      <Button
        size="xs"
        width="100%"
        onClick={action(() =>
          beatGridStore.setGrid(
            grid.withDownbeatAtTime(audioStore.globalTime),
          ),
        )}
      >
        Set downbeat here
      </Button>

      <HStack>
        <Button
          size="xs"
          flex={1}
          bgColor={beatGridStore.showGrid ? "orange.700" : undefined}
          color={beatGridStore.showGrid ? "white" : undefined}
          onClick={action(() => beatGridStore.toggleGrid())}
        >
          Show grid
        </Button>
        <Button
          size="xs"
          flex={1}
          bgColor={beatGridStore.showAnchors ? "orange.700" : undefined}
          color={beatGridStore.showAnchors ? "white" : undefined}
          onClick={action(() => beatGridStore.toggleAnchors())}
        >
          Show anchors
        </Button>
        <Button
          size="xs"
          flex={1}
          bgColor={beatGridStore.metronomeEnabled ? "orange.700" : undefined}
          color={beatGridStore.metronomeEnabled ? "white" : undefined}
          onClick={action(() => beatGridStore.toggleMetronome())}
        >
          Metronome
        </Button>
      </HStack>

      <Divider />

      <HStack justifyContent="space-between">
        <Text fontSize="xs">
          {grid.anchors.length === 1
            ? "Fixed tempo"
            : `${grid.anchors.length} tempo anchors`}
        </Text>
        <HStack spacing={1}>
          <Button
            size="xs"
            onClick={action(() =>
              beatGridStore.setGrid(
                grid.withAnchorAtTime(audioStore.globalTime),
              ),
            )}
          >
            Pin here
          </Button>
          <Button
            size="xs"
            isDisabled={anchorIndexAtPlayhead < 0 || grid.anchors.length <= 1}
            onClick={action(() =>
              beatGridStore.setGrid(grid.withoutAnchor(anchorIndexAtPlayhead)),
            )}
          >
            Unpin
          </Button>
        </HStack>
      </HStack>

      <HStack justifyContent="space-between">
        {analysisState === "analyzing" ? (
          <Badge colorScheme="blue">Analyzing…</Badge>
        ) : grid.source === "manual" ? (
          <Badge>Edited by hand</Badge>
        ) : analysisState === "failed" ? (
          <Badge colorScheme="red">Detection failed</Badge>
        ) : (
          // Qualitative rather than a percentage: the number measures how far
          // the winning tempo beat its nearest rival, which reads as alarming
          // when shown as a confidence score even on a clean detection.
          <Badge
            colorScheme={grid.confidence > CLEAR_DETECTION ? "green" : "yellow"}
            title={`Margin over the next best tempo: ${Math.round(
              grid.confidence * 100,
            )}%`}
          >
            {grid.confidence > CLEAR_DETECTION ? "Detected" : "Check tempo"}
          </Badge>
        )}
        <Button
          size="xs"
          onClick={reanalyze}
          isLoading={analysisState === "analyzing"}
        >
          Re-analyze
        </Button>
      </HStack>
    </VStack>
  );
});
