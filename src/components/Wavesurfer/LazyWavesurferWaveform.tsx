import dynamic from "next/dynamic";

// lazy load WavesurferWaveform because Wavesurfer can't be run on the server
export const LazyWavesurferWaveform = dynamic(
  () => import("@/src/components/Wavesurfer/WavesurferWaveform"),
  {
    ssr: false,
  },
);
