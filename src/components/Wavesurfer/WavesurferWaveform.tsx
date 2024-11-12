import { useStore } from "@/src/types/StoreContext";
import { Box, Skeleton } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useRef, useEffect, useState, useMemo } from "react";
import { clamp } from "three/src/math/MathUtils";
import WaveSurferPlayer from "@wavesurfer/react";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import MinimapPlugin from "wavesurfer.js/dist/plugins/minimap";
import { action, runInAction } from "mobx";
import { useCloneCanvas } from "@/src/components/Wavesurfer/hooks/cloneCanvas";
import { debounce } from "lodash";

const DEFAULT_MINIMAP_HEIGHT = 20;

const scrollIntoView = debounce(
  () =>
    document.getElementById("playhead")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    }),
  20,
  { leading: false, trailing: true }
);

const WavesurferWaveform = observer(function WavesurferWaveform() {
  const store = useStore();
  const { audioStore, uiStore, playlistStore } = store;

  const [isReady, setIsReady] = useState(false);
  const clonedWaveformRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const cloneCanvas = useCloneCanvas(clonedWaveformRef);

  const plugins = useMemo(() => {
    const timelinePlugin = TimelinePlugin.create({
      insertPosition: "beforebegin",
      style: { fontSize: "14px", color: "#000000", zIndex: "100" },
      height: uiStore.canTimelineZoom ? 60 : 80,
      primaryLabelInterval: uiStore.canTimelineZoom ? 5 : 30,
      secondaryLabelInterval: uiStore.canTimelineZoom ? 1 : 0,
      timeInterval: uiStore.canTimelineZoom ? 0.25 : 5,
    });
    const minimapPlugin = MinimapPlugin.create({
      waveColor: "#bbb",
      progressColor: "#0178FF",
      cursorColor: "#FF0000FF",
      container: "#minimap",
      height: DEFAULT_MINIMAP_HEIGHT,
      insertPosition: "beforebegin",
    });
    minimapPlugin.on("interaction", () => {
      audioStore.setTimeWithCursor(
        Math.max(0, audioStore.wavesurfer!.getCurrentTime())
      );
      scrollIntoView();
    });
    return [timelinePlugin, minimapPlugin];
  }, [audioStore, uiStore.canTimelineZoom]);

  // on audio latency change
  useEffect(() => {
    if (!isReady || !audioRef.current) return;
    const audioElement = audioRef.current;
    const audioContext = new AudioContext();
    runInAction(() => (audioStore.audioContext = audioContext));
    const mediaSource = audioContext.createMediaElementSource(audioElement);
    const delayNode = audioContext.createDelay(5);
    delayNode.delayTime.value = audioStore.audioLatency;
    mediaSource.connect(delayNode);
    delayNode.connect(audioContext.destination);
    return () => {
      audioContext.close();
      runInAction(() => (audioStore.audioContext = null));
    };
  }, [audioStore, audioStore.audioLatency, isReady]);

  // on audio state change
  useEffect(() => {
    if (!audioStore.wavesurfer || !isReady) return;
    if (audioStore.audioState === "starting") {
      audioStore.wavesurfer.play();
    } else if (audioStore.audioState === "paused") {
      audioStore.wavesurfer.pause();
    }
  }, [audioStore.audioState, audioStore.wavesurfer, isReady]);

  // on mute toggle
  useEffect(() => {
    if (!audioStore.wavesurfer || !isReady) return;
    audioStore.wavesurfer.setMuted(audioStore.audioMuted);
  }, [audioStore.audioMuted, audioStore.wavesurfer, isReady]);

  // on zoom change
  useEffect(() => {
    if (!audioStore.wavesurfer || !isReady || !uiStore.canTimelineZoom) return;
    audioStore.wavesurfer.zoom(uiStore.pixelsPerSecond);
    cloneCanvas();
  }, [cloneCanvas, uiStore.pixelsPerSecond, uiStore.canTimelineZoom, audioStore.wavesurfer, isReady]);

  // on cursor change
  useEffect(() => {
    if (!audioStore.wavesurfer || !isReady) return;
    const duration = audioStore.wavesurfer.getDuration();
    const progress =
      duration > 0 ? audioStore.lastCursor.position / duration : 0;
    audioStore.wavesurfer.seekTo(clamp(progress, 0, 1));
  }, [audioStore.lastCursor, audioStore.wavesurfer, isReady]);

  const dragToSeek = useMemo(() => ({ debounceTime: 50 }), []);

  const commonWavesurferUI = (
    <>
      <audio ref={audioRef} crossOrigin="anonymous" />
      <Skeleton
        position="absolute"
        top={0}
        width="100%"
        height="100%"
        startColor="gray.500"
        endColor="gray.700"
        speed={0.4}
        isLoaded={isReady}
      />
      <Box
        position="absolute"
        top={uiStore.canTimelineZoom ? "20px" : "0"}
        width={uiStore.canTimelineZoom ? undefined : "100%"}
        id="waveform"
        display="block"
      >
        <WaveSurferPlayer
          // https://wavesurfer-js.org/docs/options.html
          // NOTE: all object/array props must be memoized! https://github.com/katspaugh/wavesurfer-react/pull/8
          waveColor="#DDDDDD"
          progressColor="#0178FF"
          cursorColor="#FF0000FF"
          barWidth={uiStore.canTimelineZoom ? undefined : 3}
          barRadius={uiStore.canTimelineZoom ? undefined : 10}
          barGap={uiStore.canTimelineZoom ? undefined : 1}
          height={uiStore.canTimelineZoom ? 60 : 80}
          fillParent={!uiStore.canTimelineZoom}
          minPxPerSec={
            uiStore.canTimelineZoom ? uiStore.pixelsPerSecond : undefined
          }
          hideScrollbar={true}
          autoScroll={false}
          autoCenter={false}
          interact={true}
          dragToSeek={dragToSeek}
          url={audioStore.getSelectedSongUrl()}
          plugins={plugins}
          media={audioRef.current ?? undefined}
          onReady={action((wavesurfer) => {
            audioStore.wavesurfer = wavesurfer;
            if (audioStore.audioMuted) wavesurfer.setMuted(true);
            uiStore.canTimelineZoom && wavesurfer.zoom(uiStore.pixelsPerSecond);
            wavesurfer.seekTo(0);
            const audioBuffer = wavesurfer.getDecodedData();
            if (audioBuffer) audioStore.computePeaks(audioBuffer);
            if (
              audioStore.audioState === "starting" ||
              audioStore.audioState === "playing"
            )
              // will throw NotAllowedError if autoplay is blocked
              wavesurfer.play().catch((e) => console.error(e));
            cloneCanvas();
          })}
          onRedraw={() => setIsReady(true)}
          onInteraction={(wavesurfer, newTime: number) => {
            audioStore.setTimeWithCursor(Math.max(0, newTime));
          }}
          onAudioprocess={(wavesurfer, currentTime: number) =>
            audioStore.onTick(currentTime)
          }
          onPlay={action(() => (audioStore.audioState = "playing"))}
          onFinish={action(() => {
            audioStore.audioState = "paused";
            if (store.context === "playlistEditor")
              playlistStore.playNextExperience();
          })}
          onLoading={(wavesurfer) => {
            setIsReady(false);
            wavesurfer.stop();
            audioStore.setTimeWithCursor(0);
          }}
        />
      </Box>
    </>
  );

  return uiStore.canTimelineZoom ? (
    <Box width="100%" height={20} bgColor="gray.500">
      <Box
        id="minimap"
        position="sticky"
        top={0}
        left="150px"
        boxSizing="border-box"
        borderBottom={1}
        borderColor="black"
        borderBottomStyle="solid"
        bgColor="gray.600"
        width={`calc(${uiStore.horizontalLayout ? "100vw" : "60vw"} - 150px)`}
        height={`${DEFAULT_MINIMAP_HEIGHT}px`}
        zIndex={100}
      />
      {commonWavesurferUI}
      {uiStore.showingWaveformOverlay && (
        <Box
          ref={clonedWaveformRef}
          position="absolute"
          top="80px"
          pointerEvents="none"
        />
      )}
    </Box>
  ) : (
    <Box position="relative" flexGrow={1} height={20} bgColor="gray.500">
      {commonWavesurferUI}
    </Box>
  );
});

export default WavesurferWaveform;
