import { useStore } from "@/src/types/StoreContext";
import { Box, Skeleton } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useRef, useEffect, useMemo } from "react";
import { clamp } from "three/src/math/MathUtils";
import WaveSurferPlayer from "@wavesurfer/react";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import MinimapPlugin from "wavesurfer.js/dist/plugins/minimap";
import { action, runInAction } from "mobx";
import { useCloneCanvas } from "@/src/components/Wavesurfer/hooks/cloneCanvas";
import { debounce } from "lodash";
import { NO_SONG } from "@/src/types/Song";
import { INITIAL_PIXELS_PER_SECOND } from "@/src/utils/time";
import { getTimelineLabelIntervals } from "@/src/utils/timelineZoom";

const DEFAULT_MINIMAP_HEIGHT = 20;
const WAVESURFER_ZOOM_DEBOUNCE_MS = 80;

type TimelineLabelOptions = ReturnType<typeof getTimelineLabelIntervals>;

const setTimelineLabelIntervals = (
  timelinePlugin: TimelinePlugin | null,
  pps: number,
) => {
  if (!timelinePlugin) return;
  Object.assign(
    (timelinePlugin as TimelinePlugin & { options: TimelineLabelOptions })
      .options,
    getTimelineLabelIntervals(pps),
  );
};

const scrollIntoView = debounce(
  () =>
    document.getElementById("playhead")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    }),
  20,
  { leading: false, trailing: true },
);

const WavesurferWaveform = observer(function WavesurferWaveform() {
  const store = useStore();
  const { audioStore, uiStore, playlistStore } = store;

  const setAudioReady = action(
    (ready: boolean) => (audioStore.audioReady = ready),
  );

  const clonedWaveformRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  // Keep Wavesurfer's React prop stable so layout zoom doesn't force an
  // immediate redraw; we drive zoom imperatively (debounced) instead.
  const initialMinPxPerSecRef = useRef(
    uiStore.canTimelineZoom ? uiStore.pixelsPerSecond : INITIAL_PIXELS_PER_SECOND,
  );

  const cloneCanvas = useCloneCanvas(clonedWaveformRef);

  const plugins = useMemo(() => {
    const timelinePlugin = TimelinePlugin.create({
      insertPosition: "beforebegin",
      style: { fontSize: "14px", color: "#000000", zIndex: "100" },
      height: uiStore.canTimelineZoom ? 60 : 80,
      ...(uiStore.canTimelineZoom
        ? getTimelineLabelIntervals(uiStore.pixelsPerSecond)
        : {
            primaryLabelInterval: 30,
            secondaryLabelInterval: 0,
            timeInterval: 5,
          }),
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
        Math.max(0, audioStore.wavesurfer!.getCurrentTime()),
      );
      scrollIntoView();
    });
    runInAction(() => {
      audioStore.timelinePlugin = timelinePlugin;
      audioStore.minimapPlugin = minimapPlugin;
    });
    return [timelinePlugin, minimapPlugin];
    // Intentionally omit pixelsPerSecond — label intervals are updated on zoom
    // via mutating timelinePlugin.options, not by recreating plugins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioStore, uiStore.canTimelineZoom]);

  const applyWavesurferZoom = useMemo(
    () =>
      debounce((pps: number) => {
        setTimelineLabelIntervals(audioStore.timelinePlugin, pps);
        audioStore.wavesurfer?.zoom(pps);
        cloneCanvas();
      }, WAVESURFER_ZOOM_DEBOUNCE_MS),
    [audioStore, cloneCanvas],
  );

  useEffect(() => {
    return () => {
      applyWavesurferZoom.flush();
      applyWavesurferZoom.cancel();
    };
  }, [applyWavesurferZoom]);

  // on audio latency change
  useEffect(() => {
    if (!audioStore.audioReady || !audioRef.current) return;

    // initialize audio context if necessary
    if (!audioStore.audioContext) {
      const audioElement = audioRef.current;
      const audioContext = new AudioContext();
      runInAction(() => (audioStore.audioContext = audioContext));
      const mediaSource = audioContext.createMediaElementSource(audioElement);
      const delayNode = audioContext.createDelay(5);
      runInAction(() => (audioStore.delayNode = delayNode));
      delayNode.delayTime.value = audioStore.audioLatency;
      mediaSource.connect(delayNode);
      delayNode.connect(audioContext.destination);
    }

    if (audioStore.delayNode)
      audioStore.delayNode.delayTime.value = audioStore.audioLatency;
  }, [audioStore, audioStore.audioLatency, audioStore.audioReady]);

  // on audio state change
  useEffect(() => {
    if (!audioStore.wavesurfer || !audioStore.audioReady) return;
    if (audioStore.audioState === "starting") {
      audioStore.wavesurfer.play();
    } else if (audioStore.audioState === "paused") {
      audioStore.wavesurfer.pause();
    }
  }, [audioStore.audioState, audioStore.wavesurfer, audioStore.audioReady]);

  // on mute toggle
  useEffect(() => {
    if (!audioStore.wavesurfer || !audioStore.audioReady) return;
    audioStore.wavesurfer.setMuted(audioStore.audioMuted);
  }, [audioStore.audioMuted, audioStore.wavesurfer, audioStore.audioReady]);

  // on volume change
  useEffect(() => {
    if (!audioStore.wavesurfer || !audioStore.audioReady) return;
    audioStore.wavesurfer.setVolume(audioStore.audioVolume);
  }, [audioStore.audioVolume, audioStore.wavesurfer, audioStore.audioReady]);

  // Debounced Wavesurfer zoom: blocks/layout update immediately via MobX;
  // the expensive canvas redraw catches up shortly after zooming settles.
  useEffect(() => {
    if (
      !audioStore.wavesurfer ||
      !audioStore.audioReady ||
      !uiStore.canTimelineZoom
    )
      return;

    applyWavesurferZoom(uiStore.pixelsPerSecond);
  }, [
    applyWavesurferZoom,
    uiStore.pixelsPerSecond,
    uiStore.canTimelineZoom,
    audioStore.wavesurfer,
    audioStore.audioReady,
  ]);

  // on cursor change
  useEffect(() => {
    if (!audioStore.wavesurfer || !audioStore.audioReady) return;
    const duration = audioStore.wavesurfer.getDuration();
    const progress =
      duration > 0 ? audioStore.lastCursor.position / duration : 0;
    audioStore.wavesurfer.seekTo(clamp(progress, 0, 1));
  }, [audioStore.lastCursor, audioStore.wavesurfer, audioStore.audioReady]);

  const dragToSeek = useMemo(() => ({ debounceTime: 50 }), []);

  const noSongSelected = audioStore.selectedSong.id === NO_SONG.id;

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
        isLoaded={audioStore.audioReady || noSongSelected}
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
            uiStore.canTimelineZoom ? initialMinPxPerSecRef.current : undefined
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
            wavesurfer.setVolume(audioStore.audioVolume);
            if (uiStore.canTimelineZoom) {
              setTimelineLabelIntervals(
                audioStore.timelinePlugin,
                uiStore.pixelsPerSecond,
              );
              wavesurfer.zoom(uiStore.pixelsPerSecond);
            }
            wavesurfer.seekTo(0);
            const audioBuffer = wavesurfer.getDecodedData();
            if (audioBuffer) audioStore.computePeaks(audioBuffer);
            if (
              audioStore.audioState === "starting" ||
              audioStore.audioState === "playing"
            )
              // will throw NotAllowedError if autoplay is blocked;
              // AbortError is expected if a newer load supersedes this play()
              wavesurfer.play().catch((e: DOMException) => {
                if (e?.name === "AbortError") return;
                console.error(e);
              });
            cloneCanvas();
          })}
          onRedraw={() => setAudioReady(true)}
          onInteraction={(wavesurfer, newTime: number) => {
            audioStore.setTimeWithCursor(Math.max(0, newTime));
          }}
          onAudioprocess={(wavesurfer, currentTime: number) =>
            audioStore.onTick(currentTime)
          }
          onPlay={action(() => (audioStore.audioState = "playing"))}
          onFinish={action(() => {
            audioStore.audioState = "paused";
            if (playlistStore.autoplay) playlistStore.playNextExperience();
          })}
          onLoad={action(() => {
            setAudioReady(false);
            audioStore.setTimeWithCursor(0);
          })}
          onError={(_wavesurfer, error: Error | MediaError) => {
            // Intentional track switches abort the previous media fetch on the shared <audio>
            if (
              ("name" in error && error.name === "AbortError") ||
              ("code" in error && error.code === MediaError.MEDIA_ERR_ABORTED)
            )
              return;
            console.error(error);
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
