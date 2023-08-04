import { useStore } from "@/src/types/StoreContext";
import { Box, Skeleton } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useRef, useEffect, useState } from "react";
import { clamp } from "three/src/math/MathUtils";
import type WaveSurfer from "wavesurfer.js";
import type { WaveSurferOptions } from "wavesurfer.js";
import type TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import type { TimelinePluginOptions } from "wavesurfer.js/dist/plugins/timeline";
import type RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import type { RegionParams } from "wavesurfer.js/dist/plugins/regions";
import { action, runInAction } from "mobx";
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
  height: 80,
  hideScrollbar: true,
  fillParent: false,
  autoScroll: false,
  autoCenter: false,
  interact: true,
};

const DEFAULT_TIMELINE_OPTIONS: TimelinePluginOptions = {
  height: 80,
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

  const { audioStore, uiStore, playlistStore } = useStore();

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

      // Instantiate timeline plugin
      const timelinePlugin = (audioStore.timelinePlugin = TimelinePlugin.create(
        DEFAULT_TIMELINE_OPTIONS
      ));

      // Instantiate regions plugin
      const regionsPlugin = (audioStore.regionsPlugin = RegionsPlugin.create());

      // Instantiate wavesurfer
      // https://wavesurfer-js.org/docs/options.html
      const options: WaveSurferOptions = {
        ...DEFAULT_WAVESURFER_OPTIONS,
        container: waveformRef.current!,
        minPxPerSec: uiStore.pixelsPerSecond,
        plugins: [timelinePlugin, regionsPlugin],
      };
      const wavesurfer = (audioStore.wavesurfer = WaveSurfer.create(options));

      wavesurfer.on("interaction", (newTime: number) => {
        if (!wavesurfer) return;
        audioStore.setTimeWithCursor(Math.max(0, newTime));
      });

      wavesurfer.on("ready", () => {
        ready.current = true;
        if (audioStore.initialRegions.length > 0) {
          audioStore.initialRegions.forEach((region) => {
            regionsPlugin.addRegion(region.withNewContentElement());
          });
        }
        regionsPlugin.on(
          "region-double-clicked",
          action((region: RegionParams) => {
            // only edit regions that have content
            if (!region.content) return;
            uiStore.showingMarkerEditorModal = true;
            uiStore.markerToEdit = region;
          })
        );
        if (audioStore.audioMuted) wavesurfer.setMuted(true);

        wavesurfer.zoom(uiStore.pixelsPerSecond);
        wavesurfer.seekTo(0);

        const audioBuffer = wavesurfer.getDecodedData();
        if (audioBuffer) audioStore.computePeaks(audioBuffer);
      });

      wavesurfer.on("finish", () => {
        if (playlistStore.autoplay) playlistStore.playNextExperience();
      });

      wavesurfer.on("timeupdate", (currentTime: number) =>
        audioStore.onTick(currentTime)
      );

      wavesurfer.on("play", () => {
        runInAction(() => {
          audioStore.audioState = "playing";
        });
      });

      // we are only truly done loading when the waveform has been drawn
      wavesurfer.on("redraw", () => setLoading(false));

      cloneCanvas();
    };

    create();
  }, [audioStore, audioStore.selectedAudioFile, uiStore, uiStore.pixelsPerSecond, playlistStore, cloneCanvas]);

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
        audioStore.setTimeWithCursor(0);
        setLoading(true);

        // Destroy the old timeline plugin
        audioStore.timelinePlugin?.destroy();
        // TODO: we destroy the plugin, but it remains in the array of wavesurfer plugins. Small
        // memory leak here, and it generally feels like there is a better way to do this

        // Create a new timeline plugin
        const { TimelinePlugin } = wavesurferConstructors.current;
        const timelinePlugin = (audioStore.timelinePlugin =
          TimelinePlugin.create(DEFAULT_TIMELINE_OPTIONS));
        audioStore.wavesurfer.registerPlugin(timelinePlugin);

        // Load the new audio file
        await audioStore.wavesurfer.load(audioStore.getSelectedAudioFileUrl());
      }
    };
    changeAudioFile();
    cloneCanvas();
  }, [audioStore, audioStore.selectedAudioFile, uiStore.pixelsPerSecond, cloneCanvas]);

  // on loop toggle
  useEffect(() => {
    if (!didInitialize.current || !ready.current) return;

    let disableDragSelection = () => {};
    const toggleLoopingMode = action(async () => {
      if (!didInitialize.current || !audioStore.regionsPlugin) return;

      const regionsPlugin = audioStore.regionsPlugin;
      if (!audioStore.loopingAudio) {
        regionsPlugin.unAll();
        regionsPlugin
          .getRegions()
          // remove the looped region, if any. looped regions will not have content
          .forEach((region) => !region.content && region.remove());
        audioStore.loopRegion = null;
        return;
      }

      disableDragSelection = regionsPlugin.enableDragSelection({
        color: loopRegionColor,
      });

      regionsPlugin.on(
        "region-created",
        action((newRegion: RegionParams) => {
          regionsPlugin.getRegions().forEach(
            (region) =>
              // remove the last looped region, if any. looped regions will not have content
              region !== newRegion && !region.content && region.remove()
          );
          audioStore.loopRegion = newRegion;
          if (!audioStore.wavesurfer) return;
          audioStore.setTimeWithCursor(Math.max(0, newRegion.start));
        })
      );
      regionsPlugin.on(
        "region-updated",
        action((region: RegionParams) => {
          audioStore.loopRegion = region;
          if (!audioStore.wavesurfer) return;
          audioStore.setTimeWithCursor(Math.max(0, region.start));
        })
      );
    });
    toggleLoopingMode();
    return disableDragSelection;
  }, [audioStore, audioStore.loopingAudio]);

  // on marker mode toggle
  useEffect(() => {
    if (!didInitialize.current || !ready.current) return;

    let disableCreateByClick = () => {};
    const toggleMarkingMode = action(async () => {
      const { wavesurfer, regionsPlugin } = audioStore;
      if (
        !didInitialize.current ||
        !audioStore.regionsPlugin ||
        !wavesurfer ||
        !regionsPlugin
      )
        return;

      if (!audioStore.markingAudio) return;

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
  }, [uiStore, audioStore, audioStore.markingAudio]);

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

  return (
    <Box width="100%" height={20} bgColor="gray.500">
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
          top="80px"
          pointerEvents="none"
        />
      )}
    </Box>
  );
});
