import { useStore } from "@/src/types/StoreContext";
import { Box } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useRef, useEffect } from "react";
import { clamp } from "three/src/math/MathUtils";
import { useDebouncedCallback } from "use-debounce";
import type WaveSurfer from "wavesurfer.js";
import type { WaveSurferOptions } from "wavesurfer.js";
import type TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import type { TimelinePluginOptions } from "wavesurfer.js/dist/plugins/timeline";
import type RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import type { RegionParams } from "wavesurfer.js/dist/plugins/regions";
import {
  ASSET_BUCKET_NAME,
  AUDIO_ASSET_PREFIX,
  ASSET_BUCKET_REGION,
} from "@/src/utils/audio";
import { action } from "mobx";

// https://wavesurfer-js.org/docs/options.html
const DEFAULT_WAVESURFER_OPTIONS: Partial<WaveSurferOptions> = {
  waveColor: "#ddd",
  progressColor: "#0178FF",
  cursorColor: "#00000000",
  height: 40,
  hideScrollbar: true,
  fillParent: false,
  autoScroll: false,
  autoCenter: false,
};

const DEFAULT_TIMELINE_OPTIONS: TimelinePluginOptions = {
  height: 40,
  insertPosition: "beforebegin" as const,
  timeInterval: 0.25,
  primaryLabelInterval: 5,
  secondaryLabelInterval: 0,
  style: {
    fontSize: "14px",
    color: "#000000",
  } as CSSStyleDeclaration,
};

// TODO: factor some of this logic out into hooks
export const WavesurferWaveform = observer(function WavesurferWaveform() {
  const didInitialize = useRef(false);
  const ready = useRef(false);

  const wavesurferConstructors = useRef<{
    WaveSurfer: typeof WaveSurfer | null;
    TimelinePlugin: typeof TimelinePlugin | null;
    RegionsPlugin: typeof RegionsPlugin | null;
  }>({ WaveSurfer: null, TimelinePlugin: null, RegionsPlugin: null });

  const timelinePlugin = useRef<TimelinePlugin | null>(null);
  const regionsPlugin = useRef<RegionsPlugin | null>(null);

  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const overlayCanvas = useRef<HTMLCanvasElement>(null);

  const { audioStore, timer, uiStore } = useStore();

  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;

    const create = async () => {
      // Can't be run on the server, so we need to use dynamic imports
      // Lazy load all wave surfer dependencies
      const [
        { default: WaveSurfer },
        { default: TimelinePlugin },
        { default: RegionsPlugin },
      ] = await Promise.all([
        import("wavesurfer.js"),
        import("wavesurfer.js/dist/plugins/timeline"),
        import("wavesurfer.js/dist/plugins/regions"),
      ]);
      wavesurferConstructors.current = {
        WaveSurfer,
        TimelinePlugin,
        RegionsPlugin,
      };

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
      await wavesurferRef.current.load(
        `https://${ASSET_BUCKET_NAME}.s3.${ASSET_BUCKET_REGION}.amazonaws.com/${AUDIO_ASSET_PREFIX}${audioStore.selectedAudioFile}`
      );
      wavesurferRef.current?.zoom(uiStore.pixelsPerSecond);

      wavesurferRef.current.on("interaction", () => {
        if (!wavesurferRef.current) return;
        timer.setTime(Math.max(0, wavesurferRef.current.getCurrentTime()));
      });

      ready.current = true;

      cloneCanvas();
    };

    create();
  }, [audioStore, audioStore.selectedAudioFile, uiStore.pixelsPerSecond, timer]);

  useEffect(() => {
    if (!didInitialize.current || !ready.current) return;

    const changeAudioFile = async () => {
      if (
        didInitialize.current &&
        wavesurferRef.current &&
        wavesurferConstructors.current.TimelinePlugin
      ) {
        wavesurferRef.current.stop();

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
        await wavesurferRef.current.load(
          `https://${ASSET_BUCKET_NAME}.s3.${ASSET_BUCKET_REGION}.amazonaws.com/${AUDIO_ASSET_PREFIX}${audioStore.selectedAudioFile}`
        );
        wavesurferRef.current.seekTo(0);
        timer.lastCursorPosition = 0;
      }
    };
    changeAudioFile();
    cloneCanvas();
  }, [audioStore.selectedAudioFile, timer]);

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
      } as RegionParams);

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

  useEffect(() => {
    if (timer.playing) {
      wavesurferRef.current?.play();
    } else {
      wavesurferRef.current?.pause();
    }
  }, [timer.playing]);

  useEffect(() => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.setMuted(audioStore.audioMuted);
  }, [audioStore.audioMuted]);

  const zoomDebounced = useDebouncedCallback((pixelsPerSecond: number) => {
    wavesurferRef.current?.zoom(pixelsPerSecond);
    cloneCanvas();
  }, 5);

  useEffect(() => {
    if (ready.current && wavesurferRef.current)
      zoomDebounced(uiStore.pixelsPerSecond);
  }, [zoomDebounced, uiStore.pixelsPerSecond]);

  useEffect(() => {
    if (ready.current && wavesurferRef.current) {
      const duration = wavesurferRef.current.getDuration();
      const progress = duration > 0 ? timer.lastCursor.position / duration : 0;
      wavesurferRef.current.seekTo(clamp(progress, 0, 1));
    }
  }, [timer.lastCursor]);

  useEffect(() => {
    if (uiStore.showingWaveformOverlay) cloneCanvas();
  }, [uiStore.showingWaveformOverlay]);

  const cloneCanvas = () => {
    if (!overlayCanvas.current) return;

    // This is all a bit brittle...
    const shadowRoot = document.querySelector("#waveform div")?.shadowRoot;
    const sourceCanvas = shadowRoot?.querySelector(
      "canvas"
    ) as HTMLCanvasElement;

    if (!sourceCanvas) return;

    const destinationCanvas = overlayCanvas.current;
    destinationCanvas.width = sourceCanvas.width;
    destinationCanvas.height = sourceCanvas.height;

    const destCtx = destinationCanvas.getContext("2d")!;
    destCtx.drawImage(sourceCanvas, 0, 0);
  };

  return (
    <>
      <Box position="absolute" top={0} id="waveform" ref={waveformRef} />
      {uiStore.showingWaveformOverlay && (
        <Box position="absolute" top="80px" id="waveform2" pointerEvents="none">
          <canvas ref={overlayCanvas} className="waveformClone" />
        </Box>
      )}
    </>
  );
});
