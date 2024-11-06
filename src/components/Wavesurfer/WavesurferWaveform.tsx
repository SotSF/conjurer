import { useStore } from "@/src/types/StoreContext";
import { Box, Skeleton } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useRef, useEffect, useState, useMemo } from "react";
import { clamp } from "three/src/math/MathUtils";
import type WaveSurfer from "wavesurfer.js";
import type { WaveSurferOptions } from "wavesurfer.js";
import type TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import type { TimelinePluginOptions } from "wavesurfer.js/dist/plugins/timeline";
import type MinimapPlugin from "wavesurfer.js/dist/plugins/minimap";
import type { MinimapPluginOptions } from "wavesurfer.js/dist/plugins/minimap";
import { action, runInAction } from "mobx";
import { useCloneCanvas } from "@/src/components/Wavesurfer/hooks/cloneCanvas";
import { debounce } from "lodash";

const importWavesurferConstructors = async () => {
  // Can't be run on the server, so we need to use dynamic imports
  const [
    { default: WaveSurfer },
    { default: TimelinePlugin },
    { default: MinimapPlugin },
  ] = await Promise.all([
    import("wavesurfer.js"),
    import("wavesurfer.js/dist/plugins/timeline"),
    import("wavesurfer.js/dist/plugins/minimap"),
  ]);
  return {
    WaveSurfer,
    TimelinePlugin,
    MinimapPlugin,
  };
};

// https://wavesurfer-js.org/docs/options.html
const DEFAULT_WAVESURFER_OPTIONS: Partial<WaveSurferOptions> = {
  waveColor: "#ddd",
  progressColor: "#0178FF",
  cursorColor: "#FF0000FF",
  hideScrollbar: true,
  autoScroll: false,
  autoCenter: false,
  interact: true,
  dragToSeek: { debounceTime: 50 },
};

const DEFAULT_TIMELINE_OPTIONS: TimelinePluginOptions = {
  insertPosition: "beforebegin",
  style: {
    fontSize: "14px",
    color: "#000000",
    zIndex: "100",
  },
};

const DEFAULT_MINIMAP_HEIGHT = 20;
const EMBEDDED_MINIMAP_HEIGHT = 40;

const DEFAULT_MINIMAP_OPTIONS: MinimapPluginOptions = {
  waveColor: "#bbb",
  progressColor: "#0178FF",
  cursorColor: "#FF0000FF",
  container: "#minimap",
  height: DEFAULT_MINIMAP_HEIGHT,
  insertPosition: "beforebegin",
};

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

// TODO: factor some of this logic out into hooks
export const WavesurferWaveform = observer(function WavesurferWaveform() {
  const didInitialize = useRef(false);
  const ready = useRef(false);
  const lastAudioLoaded = useRef("");
  const [loading, setLoading] = useState(true);

  const wavesurferConstructors = useRef<{
    WaveSurfer: typeof WaveSurfer | null;
    TimelinePlugin: typeof TimelinePlugin | null;
    MinimapPlugin: typeof MinimapPlugin | null;
  }>({
    WaveSurfer: null,
    TimelinePlugin: null,
    MinimapPlugin: null,
  });

  const waveformRef = useRef<HTMLDivElement>(null);
  const clonedWaveformRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const store = useStore();
  const { audioStore, uiStore, playlistStore, embeddedViewer } = store;

  const cloneCanvas = useCloneCanvas(clonedWaveformRef);

  const timelinePluginOptions = {
    ...DEFAULT_TIMELINE_OPTIONS,
    height: uiStore.canTimelineZoom ? 60 : 80,
    primaryLabelInterval: uiStore.canTimelineZoom ? 5 : 30,
    secondaryLabelInterval: uiStore.canTimelineZoom ? 1 : 0,
    timeInterval: uiStore.canTimelineZoom ? 0.25 : 5,
  };

  // initialize wavesurfer
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;

    const create = async () => {
      setLoading(true);

      // Lazy load all wave surfer dependencies
      const { WaveSurfer, TimelinePlugin, MinimapPlugin } =
        (wavesurferConstructors.current = await importWavesurferConstructors());

      // Instantiate timeline plugin
      const timelinePlugin = (audioStore.timelinePlugin = TimelinePlugin.create(
        timelinePluginOptions
      ));

      // Instantiate minimap plugin
      const minimapPlugin = (audioStore.minimapPlugin = MinimapPlugin.create({
        ...DEFAULT_MINIMAP_OPTIONS,
        height: embeddedViewer
          ? EMBEDDED_MINIMAP_HEIGHT
          : DEFAULT_MINIMAP_HEIGHT,
      }));

      // Instantiate wavesurfer
      // https://wavesurfer-js.org/docs/options.html
      const options: WaveSurferOptions = {
        ...DEFAULT_WAVESURFER_OPTIONS,
        container: waveformRef.current!,
        height: uiStore.canTimelineZoom ? 60 : 80,
        fillParent: !uiStore.canTimelineZoom,
        minPxPerSec: uiStore.canTimelineZoom
          ? uiStore.pixelsPerSecond
          : undefined,
        plugins: [timelinePlugin, minimapPlugin],
        media: audioRef.current!,
      };
      const wavesurfer = WaveSurfer.create(options);
      runInAction(() => (audioStore.wavesurfer = wavesurfer));

      wavesurfer.on("interaction", (newTime: number) => {
        if (!wavesurfer) return;
        audioStore.setTimeWithCursor(Math.max(0, newTime));
      });

      minimapPlugin.on("interaction", () => {
        if (!wavesurfer) return;
        audioStore.setTimeWithCursor(Math.max(0, wavesurfer.getCurrentTime()));
        scrollIntoView();
      });

      wavesurfer.on("ready", () => {
        ready.current = true;

        if (audioStore.audioMuted) wavesurfer.setMuted(true);

        uiStore.canTimelineZoom && wavesurfer.zoom(uiStore.pixelsPerSecond);
        wavesurfer.seekTo(0);

        const audioBuffer = wavesurfer.getDecodedData();
        if (audioBuffer) audioStore.computePeaks(audioBuffer);

        if (audioStore.audioState === "starting")
          // will throw an error NotAllowedError if autoplay is blocked
          wavesurfer.play().catch((e) => console.error(e));
      });

      wavesurfer.on(
        "finish",
        action(() => {
          audioStore.audioState = "paused";
          if (store.context === "playlistEditor")
            playlistStore.playNextExperience();
        })
      );

      wavesurfer.on("audioprocess", (currentTime: number) =>
        audioStore.onTick(currentTime)
      );

      wavesurfer.on(
        "play",
        action(() => (audioStore.audioState = "playing"))
      );

      // we are only truly done loading when the waveform has been drawn
      wavesurfer.on("redraw", () => setLoading(false));

      audioRef.current!.addEventListener(
        "canplay",
        () => {
          // delay audio in order to sync with video
          const audioContext = new AudioContext();
          runInAction(() => (audioStore.audioContext = audioContext));
          const mediaSource = audioContext.createMediaElementSource(
            audioRef.current!
          );
          const delayNode = audioContext.createDelay(1);
          delayNode.delayTime.value = audioStore.audioLatency;
          mediaSource.connect(delayNode);
          delayNode.connect(audioContext.destination);
        },
        { once: true }
      );

      cloneCanvas();
    };

    create();
  }, [store.context, audioStore, audioStore.selectedSong, uiStore, uiStore.pixelsPerSecond, playlistStore, cloneCanvas, timelinePluginOptions, embeddedViewer]);

  // on selected audio file change
  useEffect(() => {
    if (!didInitialize.current) return;

    const changeAudioFile = async () => {
      if (
        didInitialize.current &&
        audioStore.wavesurfer &&
        wavesurferConstructors.current.TimelinePlugin &&
        wavesurferConstructors.current.MinimapPlugin &&
        lastAudioLoaded.current !== audioStore.selectedSong.filename
      ) {
        ready.current = false;
        lastAudioLoaded.current = audioStore.selectedSong.filename;
        audioStore.wavesurfer.stop();
        audioStore.setTimeWithCursor(0);
        setLoading(true);

        // Destroy the old timeline plugin
        audioStore.timelinePlugin?.destroy();
        // TODO: we destroy the plugin, but it remains in the array of wavesurfer plugins. Small
        // memory leak here, and it generally feels like there is a better way to do this

        // Create a new timeline plugin
        const { TimelinePlugin } = wavesurferConstructors.current;
        const timelinePlugin = (audioStore.timelinePlugin =
          TimelinePlugin.create(timelinePluginOptions));
        audioStore.wavesurfer.registerPlugin(timelinePlugin);

        // Destroy the old minimap plugin
        audioStore.minimapPlugin?.destroy();

        // Create a new minimap plugin
        const { MinimapPlugin } = wavesurferConstructors.current;
        const minimapPlugin = (audioStore.minimapPlugin = MinimapPlugin.create({
          ...DEFAULT_MINIMAP_OPTIONS,
          height: embeddedViewer
            ? EMBEDDED_MINIMAP_HEIGHT
            : DEFAULT_MINIMAP_HEIGHT,
        }));
        audioStore.wavesurfer.registerPlugin(minimapPlugin);

        minimapPlugin.on("interaction", () => {
          if (!audioStore.wavesurfer) return;
          audioStore.setTimeWithCursor(
            Math.max(0, audioStore.wavesurfer.getCurrentTime())
          );
          scrollIntoView();
        });

        if (!audioStore.selectedSong.filename) {
          audioStore.wavesurfer.empty();
        } else {
          // Load the new audio file
          await audioStore.wavesurfer.load(audioStore.getSelectedSongUrl());
        }
      }
    };
    changeAudioFile();
    cloneCanvas();
  }, [audioStore, audioStore.wavesurfer, audioStore.selectedSong, uiStore.pixelsPerSecond, cloneCanvas, timelinePluginOptions, embeddedViewer]);

  // on audio state change
  useEffect(() => {
    if (!didInitialize.current || !ready.current) return;
    if (audioStore.audioState === "starting") {
      audioStore.wavesurfer?.play();
    } else if (audioStore.audioState === "paused") {
      audioStore.wavesurfer?.pause();
    }
  }, [audioStore.audioState, audioStore.wavesurfer]);

  // on mute toggle
  useEffect(() => {
    if (!audioStore.wavesurfer || !ready.current) return;
    audioStore.wavesurfer.setMuted(audioStore.audioMuted);
  }, [audioStore.audioMuted, audioStore.wavesurfer]);

  // on zoom change
  useEffect(() => {
    if (!audioStore.wavesurfer || !ready.current) return;
    uiStore.canTimelineZoom &&
      audioStore.wavesurfer.zoom(uiStore.pixelsPerSecond);
    cloneCanvas();
  }, [cloneCanvas, uiStore.pixelsPerSecond, audioStore.wavesurfer]);

  // on cursor change
  useEffect(() => {
    if (!audioStore.wavesurfer || !ready.current) return;
    const duration = audioStore.wavesurfer.getDuration();
    const progress =
      duration > 0 ? audioStore.lastCursor.position / duration : 0;
    audioStore.wavesurfer.seekTo(clamp(progress, 0, 1));
  }, [audioStore.lastCursor, audioStore.wavesurfer]);

  return uiStore.canTimelineZoom ? (
    <Box
      width="100%"
      height={embeddedViewer ? `${EMBEDDED_MINIMAP_HEIGHT}px` : 20}
      bgColor="gray.500"
    >
      <Box
        id="minimap"
        position="sticky"
        top={0}
        left="150px"
        boxSizing="border-box"
        borderBottom={embeddedViewer ? 0 : 1}
        borderColor="black"
        borderBottomStyle="solid"
        bgColor="gray.600"
        width={`calc(${uiStore.horizontalLayout ? "100vw" : "60vw"} - 150px)`}
        height={`${
          embeddedViewer ? EMBEDDED_MINIMAP_HEIGHT : DEFAULT_MINIMAP_HEIGHT
        }px`}
        zIndex={100}
      />
      <audio ref={audioRef} />
      <Skeleton
        position="absolute"
        top={0}
        width="100%"
        height="100%"
        startColor="gray.500"
        endColor="gray.700"
        speed={0.4}
        isLoaded={!loading || !audioStore.selectedSong.filename}
      />
      <Box
        position="absolute"
        top="20px"
        id="waveform"
        display={embeddedViewer ? "none" : "block"}
        ref={waveformRef}
      />
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
      <audio ref={audioRef} />
      <Skeleton
        position="absolute"
        top={0}
        width="100%"
        height="100%"
        startColor="gray.500"
        endColor="gray.700"
        speed={0.4}
        isLoaded={!loading || !audioStore.selectedSong.filename}
      />
      <Box
        position="absolute"
        top="0"
        width="100%"
        id="waveform"
        display="block"
        ref={waveformRef}
      />
    </Box>
  );
});
