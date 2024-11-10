import { Button, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";

// NOTE:
//  60,000 / BPM = [one beat in ms]
//  BPM = 60000 / [one beat in ms]
const MS_IN_M = 60_000;
const tempo = 120; // 120 BPM

const MIN_BEATS = 10;

async function loadSound(audioContext: AudioContext) {
  let response = await fetch("./kick.mp3", { mode: "no-cors" });
  let arrayBuffer = await response.arrayBuffer();
  let audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return audioBuffer;
}

function playSound(audioContext: AudioContext, audioBuffer: AudioBuffer) {
  const player = audioContext.createBufferSource();
  player.buffer = audioBuffer;
  player.connect(audioContext.destination);
  player.loop = false;
  player.start();
}

export function LatencyTest() {
  const initialized = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);
  const audioBuffer = useRef<AudioBuffer | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [beatTimes, setBeatTimes] = useState<Date[]>([]);
  const [userTimes, setUserTimes] = useState<Date[]>([]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initialize = async () => {
      audioContext.current = new AudioContext();
      audioBuffer.current = await loadSound(audioContext.current);
    };

    initialize();
  }, [initialized]);

  const userTempo = useMemo(() => {
    if (userTimes.length < 2) return 0;

    const userTimesMs = userTimes.map((time, index) => {
      if (index === 0) return 0;
      return time.getTime() - userTimes[index - 1].getTime();
    });

    const average =
      userTimesMs.reduce((acc, curr) => acc + curr, 0) / userTimesMs.length;
    return MS_IN_M / average;
  }, [userTimes]);

  useEffect(() => {
    if (!isRunning) return;

    let currentBpmInMs = MS_IN_M / tempo;
    const interval = setInterval(() => {
      if (!audioContext.current || !audioBuffer.current) return;
      playSound(audioContext.current, audioBuffer.current);
      setBeatTimes((beatTimes) => [...beatTimes, new Date()]);
    }, currentBpmInMs);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <>
      <Text>Latency Test</Text>
      <Button
        onClick={async () => {
          if (!audioContext.current || !audioBuffer.current) return;

          if (isRunning) {
            setUserTimes((userTimes) => [...userTimes, new Date()]);
            if (userTimes.length > MIN_BEATS) {
              setUserTimes((userTimes) => userTimes.slice(1));
              setBeatTimes((beatTimes) => beatTimes.slice(1));
            }
            return;
          }

          setIsRunning(true);
          setBeatTimes([]);
          setUserTimes([]);
        }}
      >
        Tap
      </Button>
      <Text>Tempo: {tempo.toFixed(2)}</Text>
      <Text>User tempo: {userTempo}</Text>
    </>
  );
}
