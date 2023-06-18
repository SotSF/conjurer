import { useStore } from "@/src/types/StoreContext";
import { Box } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useRef, useEffect } from "react";
import { clamp } from "three/src/math/MathUtils";
import type WaveSurfer from "wavesurfer.js";
import type { WaveSurferOptions } from "wavesurfer.js";
import type TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import type { TimelinePluginOptions } from "wavesurfer.js/dist/plugins/timeline";
import type RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import type { RegionParams } from "wavesurfer.js/dist/plugins/regions";
import { action } from "mobx";
import { useCloneCanvas } from "@/src/components/Wavesurfer/hooks/cloneCanvas";

const importWavesurferConstructors = async () => {
  // Can't be run on the server, so we need to use dynamic imports
  const [
    { default: WaveSurfer },
    { default: TimelinePlugin },
    { default: RegionsPlugin },
  ] = await Promise.all([
    import("wavesurfer.js"),
    import("wavesurfer.js/dist/plugins/timeline"),
    import("wavesurfer.js/dist/plugins/regions"),
  ]);
  return {
    WaveSurfer,
    TimelinePlugin,
    RegionsPlugin,
  };
};

// https://wavesurfer-js.org/docs/options.html
const DEFAULT_WAVESURFER_OPTIONS: Partial<WaveSurferOptions> = {
  waveColor: "#ddd",
  progressColor: "#0178FF",
  cursorColor: "#FF0000FF",
  height: 40,
  hideScrollbar: true,
  fillParent: false,
  autoScroll: false,
  autoCenter: false,
  interact: true,
};

const DEFAULT_TIMELINE_OPTIONS: TimelinePluginOptions = {
  height: 40,
  insertPosition: "beforebegin",
  timeInterval: 0.25,
  primaryLabelInterval: 5,
  secondaryLabelInterval: 1,
  style: {
    fontSize: "14px",
    color: "#000000",
  },
};

// TODO: factor some of this logic out into hooks
export const WavesurferWaveform = observer(function WavesurferWaveform() {
  const didInitialize = useRef(false);
  const ready = useRef(false);
  const lastAudioLoaded = useRef("");

  const wavesurferConstructors = useRef<{
    WaveSurfer: typeof WaveSurfer | null;
    TimelinePlugin: typeof TimelinePlugin | null;
    RegionsPlugin: typeof RegionsPlugin | null;
  }>({ WaveSurfer: null, TimelinePlugin: null, RegionsPlugin: null });

  const timelinePlugin = useRef<TimelinePlugin | null>(null);
  const regionsPlugin = useRef<RegionsPlugin | null>(null);

  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const clonedWaveformRef = useRef<HTMLDivElement>(null);

  const { audioStore, timer, uiStore } = useStore();

  const cloneCanvas = useCloneCanvas(clonedWaveformRef);

  // initialize wavesurfer
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;

    const create = async () => {
      // Lazy load all wave surfer dependencies
      const { WaveSurfer, TimelinePlugin, RegionsPlugin } =
        (wavesurferConstructors.current = await importWavesurferConstructors());

      // Instantiate plugins
      timelinePlugin.current = TimelinePlugin.create(DEFAULT_TIMELINE_OPTIONS);
      regionsPlugin.current = RegionsPlugin.create();

      // Instantiate wavesurfer
      // https://wavesurfer-js.org/docs/options.html
      const options: WaveSurferOptions = {
        ...DEFAULT_WAVESURFER_OPTIONS,
        container: waveformRef.current!,
        minPxPerSec: uiStore.pixelsPerSecond,
        plugins: [timelinePlugin.current, regionsPlugin.current],
      };
      wavesurferRef.current = WaveSurfer.create(options);

      // Load selected audio file
      if (audioStore.selectedAudioFile) {
        await wavesurferRef.current.load(audioStore.getSelectedAudioFileUrl());
        wavesurferRef.current?.zoom(uiStore.pixelsPerSecond);
        ready.current = true;
      }

      wavesurferRef.current.on("interaction", (newTime: number) => {
        if (!wavesurferRef.current) return;
        timer.setTime(Math.max(0, newTime));
      });

      cloneCanvas();
    };

    create();
  }, [audioStore, audioStore.selectedAudioFile, uiStore.pixelsPerSecond, timer, cloneCanvas]);

  // on selected audio file change
  useEffect(() => {
    if (!didInitialize.current) return;

    const changeAudioFile = async () => {
      if (
        didInitialize.current &&
        wavesurferRef.current &&
        wavesurferConstructors.current.TimelinePlugin &&
        lastAudioLoaded.current !== audioStore.selectedAudioFile
      ) {
        ready.current = false;
        lastAudioLoaded.current = audioStore.selectedAudioFile;
        wavesurferRef.current.stop();
        timer.playing = false;
        timer.setTime(0);

        // Destroy the old timeline plugin
        timelinePlugin.current?.destroy();
        // TODO: we destroy the plugin, but it remains in the array of wavesurfer plugins. Small
        // memory leak here, and it generally feels like there is a better way to do this

        // Create a new timeline plugin
        const { TimelinePlugin } = wavesurferConstructors.current;
        timelinePlugin.current = TimelinePlugin.create(
          DEFAULT_TIMELINE_OPTIONS
        );
        wavesurferRef.current.registerPlugin(timelinePlugin.current);
        await wavesurferRef.current.load(audioStore.getSelectedAudioFileUrl());
        wavesurferRef.current.zoom(uiStore.pixelsPerSecond);
        wavesurferRef.current.seekTo(0);
        ready.current = true;
      }
    };
    changeAudioFile();
    cloneCanvas();
  }, [audioStore, audioStore.selectedAudioFile, timer, uiStore.pixelsPerSecond, cloneCanvas]);

  // on loop toggle
  useEffect(() => {
    if (!didInitialize.current || !ready.current) return;

    let disableDragSelection = () => {};
    const toggleLoopingMode = action(async () => {
      if (!didInitialize.current || !regionsPlugin.current) return;

      if (!audioStore.audioLooping) {
        regionsPlugin.current.unAll();
        regionsPlugin.current.clearRegions();
        audioStore.selectedRegion = null;
        return;
      }

      const regions = regionsPlugin.current;
      disableDragSelection = regions.enableDragSelection({
        color: "rgba(237, 137, 54, 0.4)",
      });

      // TODO: figure out how/when to clear region selection
      regions.on(
        "region-created",
        action((newRegion: RegionParams) => {
          // Remove all other regions, we only allow one region at a time
          regions
            .getRegions()
            .forEach((region) => region !== newRegion && region.remove());
          audioStore.selectedRegion = newRegion;
          if (!wavesurferRef.current) return;
          timer.setTime(Math.max(0, newRegion.start));
        })
      );
      regions.on(
        "region-updated",
        action((region: RegionParams) => {
          audioStore.selectedRegion = region;
          if (!wavesurferRef.current) return;
          timer.setTime(Math.max(0, region.start));
        })
      );
    });
    toggleLoopingMode();
    return disableDragSelection;
  }, [audioStore, audioStore.audioLooping, timer]);

  // on play/pause toggle
  useEffect(() => {
    if (!didInitialize.current || !ready.current) return;
    if (timer.playing) {
      wavesurferRef.current?.play();
    } else {
      wavesurferRef.current?.pause();
    }
  }, [timer.playing]);

  // on mute toggle
  useEffect(() => {
    if (!wavesurferRef.current || !ready.current) return;
    wavesurferRef.current.setMuted(audioStore.audioMuted);
  }, [audioStore.audioMuted]);

  // on zoom change
  useEffect(() => {
    if (!wavesurferRef.current || !ready.current) return;
    wavesurferRef.current.zoom(uiStore.pixelsPerSecond);
    cloneCanvas();
  }, [cloneCanvas, uiStore.pixelsPerSecond]);

  // on cursor change
  useEffect(() => {
    if (!wavesurferRef.current || !ready.current) return;
    const duration = wavesurferRef.current.getDuration();
    const progress = duration > 0 ? timer.lastCursor.position / duration : 0;
    wavesurferRef.current.seekTo(clamp(progress, 0, 1));
  }, [timer.lastCursor]);

  return (
    <Box width="100%" height={10} bgColor="gray.500">
      <Box position="absolute" top={0} id="waveform" ref={waveformRef} />
      {uiStore.showingWaveformOverlay && (
        <Box
          ref={clonedWaveformRef}
          position="absolute"
          top="40px"
          pointerEvents="none"
        />
      )}
    </Box>
  );
});
