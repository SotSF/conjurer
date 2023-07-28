import { useStore } from "@/src/types/StoreContext";
import { Box, Skeleton, Spinner } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useRef, useEffect, useState } from "react";
import { clamp } from "three/src/math/MathUtils";
import type WaveSurfer from "wavesurfer.js";
import type { WaveSurferOptions } from "wavesurfer.js";
import type TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import type { TimelinePluginOptions } from "wavesurfer.js/dist/plugins/timeline";
import type RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import type { RegionParams } from "wavesurfer.js/dist/plugins/regions";
import { action } from "mobx";
import { useCloneCanvas } from "@/src/components/Wavesurfer/hooks/cloneCanvas";
import { loopRegionColor } from "@/src/types/AudioStore";

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
  const [loading, setLoading] = useState(true);

  const wavesurferConstructors = useRef<{
    WaveSurfer: typeof WaveSurfer | null;
    TimelinePlugin: typeof TimelinePlugin | null;
    RegionsPlugin: typeof RegionsPlugin | null;
  }>({ WaveSurfer: null, TimelinePlugin: null, RegionsPlugin: null });

  const waveformRef = useRef<HTMLDivElement>(null);
  const clonedWaveformRef = useRef<HTMLDivElement>(null);

  const { audioStore, timer, uiStore } = useStore();

  const cloneCanvas = useCloneCanvas(clonedWaveformRef);

  // initialize wavesurfer
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;

    const create = async () => {
      setLoading(true);
      // Lazy load all wave surfer dependencies
      const { WaveSurfer, TimelinePlugin, RegionsPlugin } =
        (wavesurferConstructors.current = await importWavesurferConstructors());

      // Instantiate plugins
      const timelinePlugin = (audioStore.timeline = TimelinePlugin.create(
        DEFAULT_TIMELINE_OPTIONS
      ));
      const regionsPlugin = (audioStore.regions = RegionsPlugin.create());

      // Instantiate wavesurfer
      // https://wavesurfer-js.org/docs/options.html
      const options: WaveSurferOptions = {
        ...DEFAULT_WAVESURFER_OPTIONS,
        container: waveformRef.current!,
        minPxPerSec: uiStore.pixelsPerSecond,
        plugins: [timelinePlugin, regionsPlugin],
      };
      const wavesurferRef = (audioStore.wavesurfer =
        WaveSurfer.create(options));

      wavesurferRef.on("interaction", (newTime: number) => {
        if (!wavesurferRef) return;
        timer.setTime(Math.max(0, newTime));
      });

      cloneCanvas();
      setLoading(false);
    };

    create();
  }, [audioStore, audioStore.selectedAudioFile, uiStore.pixelsPerSecond, timer, cloneCanvas]);

  // on selected audio file change
  useEffect(() => {
    if (!didInitialize.current) return;

    const changeAudioFile = async () => {
      if (
        didInitialize.current &&
        audioStore.wavesurfer &&
        wavesurferConstructors.current.TimelinePlugin &&
        lastAudioLoaded.current !== audioStore.selectedAudioFile
      ) {
        ready.current = false;
        lastAudioLoaded.current = audioStore.selectedAudioFile;
        audioStore.wavesurfer.stop();
        timer.playing = false;
        timer.setTime(0);
        setLoading(true);

        // Destroy the old timeline plugin
        audioStore.timeline?.destroy();
        // TODO: we destroy the plugin, but it remains in the array of wavesurfer plugins. Small
        // memory leak here, and it generally feels like there is a better way to do this

        // Create a new timeline plugin
        const { TimelinePlugin } = wavesurferConstructors.current;
        const timeline = (audioStore.timeline = TimelinePlugin.create(
          DEFAULT_TIMELINE_OPTIONS
        ));
        audioStore.wavesurfer.registerPlugin(timeline);
        await audioStore.wavesurfer.load(audioStore.getSelectedAudioFileUrl());
        audioStore.wavesurfer.zoom(uiStore.pixelsPerSecond);
        audioStore.wavesurfer.seekTo(0);

        const audioBuffer = audioStore.wavesurfer.getDecodedData();
        if (audioBuffer) audioStore.computePeaks(audioBuffer);

        ready.current = true;
        setLoading(false);
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
      if (!didInitialize.current || !audioStore.regions) return;

      const regions = audioStore.regions;
      if (!audioStore.loopingAudio) {
        regions.unAll();
        regions
          .getRegions()
          // remove the looped region, if any. looped regions will not have content
          .forEach((region) => !region.content && region.remove());
        audioStore.loopRegion = null;
        return;
      }

      disableDragSelection = regions.enableDragSelection({
        color: loopRegionColor,
      });

      // TODO: figure out how/when to clear region selection
      regions.on(
        "region-created",
        action((newRegion: RegionParams) => {
          regions.getRegions().forEach(
            (region) =>
              // remove the last looped region, if any. looped regions will not have content
              region !== newRegion && !region.content && region.remove()
          );
          audioStore.loopRegion = newRegion;
          if (!audioStore.wavesurfer) return;
          timer.setTime(Math.max(0, newRegion.start));
        })
      );
      regions.on(
        "region-updated",
        action((region: RegionParams) => {
          audioStore.loopRegion = region;
          if (!audioStore.wavesurfer) return;
          timer.setTime(Math.max(0, region.start));
        })
      );
    });
    toggleLoopingMode();
    return disableDragSelection;
  }, [audioStore, audioStore.loopingAudio, timer]);

  // on marker mode toggle
  useEffect(() => {
    if (!didInitialize.current || !ready.current) return;

    let disableCreateByClick = () => {};
    const toggleMarkingMode = action(async () => {
      const { wavesurfer, regions } = audioStore;
      if (
        !didInitialize.current ||
        !audioStore.regions ||
        !wavesurfer ||
        !regions
      )
        return;

      if (!audioStore.markingAudio) return;

      regions.on(
        "region-double-clicked",
        action((region: RegionParams) => {
          uiStore.showingMarkerEditorModal = true;
          uiStore.markerToEdit = region;
        })
      );

      disableCreateByClick = wavesurfer.on(
        "interaction",
        action((newTime: number) => {
          uiStore.showingMarkerEditorModal = true;
          uiStore.markerToEdit = {
            id: Math.random().toString(36).substring(7),
            start: newTime,
          };
        })
      );
    });
    toggleMarkingMode();
    return disableCreateByClick;
  }, [uiStore, audioStore, audioStore.markingAudio, timer]);

  // on play/pause toggle
  useEffect(() => {
    if (!didInitialize.current || !ready.current) return;
    if (timer.playing) {
      audioStore.wavesurfer?.play();
    } else {
      audioStore.wavesurfer?.pause();
    }
  }, [timer.playing, audioStore.wavesurfer]);

  // on mute toggle
  useEffect(() => {
    if (!audioStore.wavesurfer || !ready.current) return;
    audioStore.wavesurfer.setMuted(audioStore.audioMuted);
  }, [audioStore.audioMuted, audioStore.wavesurfer]);

  // on zoom change
  useEffect(() => {
    if (!audioStore.wavesurfer || !ready.current) return;
    audioStore.wavesurfer.zoom(uiStore.pixelsPerSecond);
    cloneCanvas();
  }, [cloneCanvas, uiStore.pixelsPerSecond, audioStore.wavesurfer]);

  // on cursor change
  useEffect(() => {
    if (!audioStore.wavesurfer || !ready.current) return;
    const duration = audioStore.wavesurfer.getDuration();
    const progress = duration > 0 ? timer.lastCursor.position / duration : 0;
    audioStore.wavesurfer.seekTo(clamp(progress, 0, 1));
  }, [timer.lastCursor, audioStore.wavesurfer]);

  return (
    <Box width="100%" height={10} bgColor="gray.500">
      <Skeleton
        width="100%"
        height="100%"
        startColor="gray.500"
        endColor="gray.700"
        speed={0.5}
        isLoaded={!loading}
      />
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
