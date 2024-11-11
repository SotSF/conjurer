import { Button, HStack, Text, VStack } from "@chakra-ui/react";
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

// Source: https://gist.github.com/AlexJWayne/1d99b3cd81d610ac7351
const accurateInterval = (time: number, fn: () => void) => {
  let cancel: any, nextAt: any, timeout: any, wrapper: any, _ref: any;
  nextAt = new Date().getTime() + time;
  timeout = null;
  if (typeof time === "function")
    (_ref = [time, fn]), (fn = _ref[0]), (time = _ref[1]);
  wrapper = () => {
    nextAt += time;
    timeout = setTimeout(wrapper, nextAt - new Date().getTime());
    return fn();
  };
  cancel = () => clearTimeout(timeout);
  timeout = setTimeout(wrapper, nextAt - new Date().getTime());
  return { cancel };
};

export function LatencyTest({
  setLatency,
}: {
  setLatency: (latency: number) => void;
}) {
  const initialized = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);
  const audioBuffer = useRef<AudioBuffer | null>(null);
  const lastLatency = useRef(0);

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

  // const userTempo = useMemo(() => {
  //   if (userTimes.length < 2) return 0;

  //   const userTimesMs = userTimes
  //     .map((time, index) => {
  //       if (index === 0) return null;
  //       return time.getTime() - userTimes[index - 1].getTime();
  //     })
  //     .filter((time) => time !== null);

  //   const average =
  //     userTimesMs.reduce((acc, curr) => acc + curr, 0) / userTimesMs.length;
  //   return MS_IN_M / average;
  // }, [userTimes]);

  const userLatency = useMemo(() => {
    if (userTimes.length < 2) return 0;
    if (beatTimes.length > userTimes.length) return lastLatency.current;

    const userLatencies = beatTimes
      .map((beatTime, index) => {
        if (index >= userTimes.length) return null;
        return userTimes[index].getTime() - beatTime.getTime();
      })
      .filter((time) => time !== null);

    lastLatency.current =
      userLatencies.reduce((acc, curr) => acc + curr, 0) / userLatencies.length;

    return lastLatency.current;
  }, [beatTimes, userTimes]);

  useEffect(() => {
    if (!isRunning) return;

    let currentBpmInMs = MS_IN_M / tempo;
    const { cancel } = accurateInterval(currentBpmInMs, () => {
      if (!audioContext.current || !audioBuffer.current) return;
      playSound(audioContext.current, audioBuffer.current);
      setBeatTimes((beatTimes) => [...beatTimes, new Date()]);
    });

    return () => cancel();
  }, [isRunning]);

  return (
    <VStack>
      <Text>
        Keep clicking Tap until latency stabilizes, then click Stop. When
        satisfied, click Use latency.
      </Text>
      <Text h={8}>
        {userLatency ? `Latency: ${userLatency.toFixed(2)}ms` : ""}
      </Text>
      <HStack>
        <Button
          onClick={async () => {
            if (!audioContext.current || !audioBuffer.current) return;

            if (isRunning) {
              if (userTimes.length > MIN_BEATS) {
                setUserTimes((userTimes) => [
                  ...userTimes.slice(1),
                  new Date(),
                ]);
                setBeatTimes((beatTimes) => beatTimes.slice(1));
              } else setUserTimes((userTimes) => [...userTimes, new Date()]);
              return;
            }

            setIsRunning(true);
            setBeatTimes([]);
            setUserTimes([]);
          }}
        >
          Tap
        </Button>
        <Button onClick={() => setIsRunning(false)} isDisabled={!isRunning}>
          Stop
        </Button>
        <Button
          onClick={() => setLatency(userLatency / 1000)}
          isDisabled={isRunning || userLatency === 0}
        >
          Use latency
        </Button>
      </HStack>
    </VStack>
  );
}
