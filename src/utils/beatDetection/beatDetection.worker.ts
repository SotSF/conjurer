import { analyzeBeats } from "@/src/utils/beatDetection/analyzeBeats";

export type BeatDetectionRequest = { samples: Float32Array };

export type BeatDetectionResponse =
  | { ok: true; analysis: ReturnType<typeof analyzeBeats> }
  | { ok: false; error: string };

self.onmessage = (event: MessageEvent<BeatDetectionRequest>) => {
  try {
    const analysis = analyzeBeats(event.data.samples);
    self.postMessage({ ok: true, analysis } satisfies BeatDetectionResponse);
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    } satisfies BeatDetectionResponse);
  }
};
