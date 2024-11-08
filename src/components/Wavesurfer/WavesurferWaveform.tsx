import { useStore } from "@/src/types/StoreContext";
import { Box, Skeleton } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useRef, useEffect, useState, useMemo } from "react";
import { clamp } from "three/src/math/MathUtils";
import { useWavesurfer } from "@wavesurfer/react";
import WaveSurferPlayer from "@wavesurfer/react";

import WaveSurfer from "wavesurfer.js";
import type { WaveSurferOptions } from "wavesurfer.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import type { TimelinePluginOptions } from "wavesurfer.js/dist/plugins/timeline";
import MinimapPlugin from "wavesurfer.js/dist/plugins/minimap";
import type { MinimapPluginOptions } from "wavesurfer.js/dist/plugins/minimap";
import { action, runInAction } from "mobx";
import { useCloneCanvas } from "@/src/components/Wavesurfer/hooks/cloneCanvas";
import { debounce } from "lodash";

const DEFAULT_MINIMAP_HEIGHT = 20;

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

const WavesurferWaveform = observer(function WavesurferWaveform() {
  const [isReady, setIsReady] = useState(false);
  const clonedWaveformRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const store = useStore();
  const { audioStore, uiStore, playlistStore } = store;

  const cloneCanvas = useCloneCanvas(clonedWaveformRef);

  const plugins = useMemo(() => {
    return [
      TimelinePlugin.create({
        insertPosition: "beforebegin",
        style: {
          fontSize: "14px",
          color: "#000000",
          zIndex: "100",
        },
        height: uiStore.canTimelineZoom ? 60 : 80,
        primaryLabelInterval: uiStore.canTimelineZoom ? 5 : 30,
        secondaryLabelInterval: uiStore.canTimelineZoom ? 1 : 0,
        timeInterval: uiStore.canTimelineZoom ? 0.25 : 5,
      }),
    ];
  }, [uiStore.canTimelineZoom]);

  // initialize wavesurfer
  //   const create = async () => {

  //     // Instantiate minimap plugin
  //     // const minimapPlugin = (audioStore.minimapPlugin = MinimapPlugin.create({
  //     //   ...DEFAULT_MINIMAP_OPTIONS,
  //     //   height: embeddedViewer
  //     //     ? EMBEDDED_MINIMAP_HEIGHT
  //     //     : DEFAULT_MINIMAP_HEIGHT,
  //     // }));

  //     audioRef.current!.addEventListener(
  //       "canplay",
  //       () => {
  //         // delay audio in order to sync with video
  //         const audioContext = new AudioContext();
  //         runInAction(() => (audioStore.audioContext = audioContext));
  //         const mediaSource = audioContext.createMediaElementSource(
  //           audioRef.current!
  //         );
  //         const delayNode = audioContext.createDelay(1);
  //         delayNode.delayTime.value = audioStore.audioLatency;
  //         mediaSource.connect(delayNode);
  //         delayNode.connect(audioContext.destination);
  //       },
  //       { once: true }
  //     );

  //     cloneCanvas();
  //   };

  // on selected audio file change
  //   const changeAudioFile = async () => {
  //       minimapPlugin.on("interaction", () => {
  //         if (!audioStore.wavesurfer) return;
  //         audioStore.setTimeWithCursor(audioStore.wavesurfer.getCurrentTime());
  //         scrollIntoView();
  //       });
  //     }
  //   };
  //   changeAudioFile();
  //   cloneCanvas();

  // on audio state change
  useEffect(() => {
    if (!audioStore.wavesurfer || !isReady) return;
    if (audioStore.audioState === "starting") {
      audioStore.wavesurfer.play();
    } else if (audioStore.audioState === "paused") {
      audioStore.wavesurfer.pause();
    }
  }, [audioStore.audioState, audioStore.wavesurfer]);

  // on mute toggle
  useEffect(() => {
    if (!audioStore.wavesurfer || !isReady) return;
    audioStore.wavesurfer.setMuted(audioStore.audioMuted);
  }, [audioStore.audioMuted, audioStore.wavesurfer]);

  // on zoom change
  useEffect(() => {
    if (!audioStore.wavesurfer || !isReady || !uiStore.canTimelineZoom) return;
    audioStore.wavesurfer.zoom(uiStore.pixelsPerSecond);
    cloneCanvas();
  }, [cloneCanvas, uiStore.pixelsPerSecond, audioStore.wavesurfer]);

  // on cursor change
  useEffect(() => {
    if (!audioStore.wavesurfer || !isReady) return;
    const duration = audioStore.wavesurfer.getDuration();
    const progress =
      duration > 0 ? audioStore.lastCursor.position / duration : 0;
    audioStore.wavesurfer.seekTo(clamp(progress, 0, 1));
  }, [audioStore.lastCursor, audioStore.wavesurfer]);

  const dragToSeek = useMemo(() => ({ debounceTime: 50 }), []);
  return (
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
        isLoaded={isReady}
      />
      <Box
        position="absolute"
        top="0"
        width="100%"
        id="waveform"
        display="block"
      >
        <WaveSurferPlayer
          // https://wavesurfer-js.org/docs/options.html
          // NOTE: all object/array props must be memoized! https://github.com/katspaugh/wavesurfer-react/pull/8
          waveColor="#DDDDDD"
          progressColor="#0178FF"
          cursorColor="#FF0000FF"
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
            scrollIntoView();
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
    </Box>
  );

  // return uiStore.canTimelineZoom ? (
  //   <Box
  //     width="100%"
  //     height={embeddedViewer ? `${EMBEDDED_MINIMAP_HEIGHT}px` : 20}
  //     bgColor="gray.500"
  //   >
  //     <Box
  //       id="minimap"
  //       position="sticky"
  //       top={0}
  //       left="150px"
  //       boxSizing="border-box"
  //       borderBottom={embeddedViewer ? 0 : 1}
  //       borderColor="black"
  //       borderBottomStyle="solid"
  //       bgColor="gray.600"
  //       width={`calc(${uiStore.horizontalLayout ? "100vw" : "60vw"} - 150px)`}
  //       height={`${
  //         embeddedViewer ? EMBEDDED_MINIMAP_HEIGHT : DEFAULT_MINIMAP_HEIGHT
  //       }px`}
  //       zIndex={100}
  //     />
  //     <audio ref={audioRef} />
  //     <Skeleton
  //       position="absolute"
  //       top={0}
  //       width="100%"
  //       height="100%"
  //       startColor="gray.500"
  //       endColor="gray.700"
  //       speed={0.4}
  //       // isLoaded={!loading || !audioStore.selectedSong.filename}
  //     />
  //     <Box
  //       position="absolute"
  //       top="20px"
  //       id="waveform"
  //       display={embeddedViewer ? "none" : "block"}
  //       ref={waveformRef}
  //     />
  //     {uiStore.showingWaveformOverlay && (
  //       <Box
  //         ref={clonedWaveformRef}
  //         position="absolute"
  //         top="80px"
  //         pointerEvents="none"
  //       />
  //     )}
  //   </Box>
  // ) : (
  //   <Box position="relative" flexGrow={1} height={20} bgColor="gray.500">
  //     <audio ref={audioRef} />
  //     <Skeleton
  //       position="absolute"
  //       top={0}
  //       width="100%"
  //       height="100%"
  //       startColor="gray.500"
  //       endColor="gray.700"
  //       speed={0.4}
  //       // isLoaded={!loading || !audioStore.selectedSong.filename}
  //     />
  //     <Box
  //       position="absolute"
  //       top="0"
  //       width="100%"
  //       id="waveform"
  //       display="block"
  //       ref={waveformRef}
  //     />
  //   </Box>
  // );
});
export default WavesurferWaveform;
