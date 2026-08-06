import { BeatGrid } from "@/src/types/BeatGrid";
import { analyzeBeats, BeatAnalysis } from "@/src/utils/beatDetection/analyzeBeats";
import { toMonoAtAnalysisRate } from "@/src/utils/beatDetection/onsetEnvelope";
import type { BeatDetectionResponse } from "@/src/utils/beatDetection/beatDetection.worker";

/**
 * Run the analysis off the main thread. A five-minute track is a few thousand
 * FFTs, which would visibly stall the render loop if run inline — but an
 * environment without workers should still get a grid, so failure to spawn
 * falls back rather than giving up.
 *
 * `samples` is intentionally copied rather than transferred: a transferred
 * buffer is detached on this side, which would leave the fallback path with
 * nothing to work on if the worker then failed to start.
 */
const runAnalysis = (samples: Float32Array): Promise<BeatAnalysis | null> =>
  new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(
        new URL(
          "@/src/utils/beatDetection/beatDetection.worker.ts",
          import.meta.url,
        ),
      );
    } catch {
      resolve(analyzeBeats(samples));
      return;
    }

    let settled = false;
    const finish = (run: () => void) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      run();
    };

    worker.onmessage = (event: MessageEvent<BeatDetectionResponse>) => {
      const data = event.data;
      if (data.ok) finish(() => resolve(data.analysis));
      else finish(() => reject(new Error(data.error)));
    };
    worker.onerror = () => finish(() => resolve(analyzeBeats(samples)));

    worker.postMessage({ samples });
  });

/** Detect tempo and beat positions from decoded audio. */
export const detectBeatGrid = async (
  audioBuffer: AudioBuffer,
): Promise<BeatGrid> => {
  const analysis = await runAnalysis(toMonoAtAnalysisRate(audioBuffer));
  if (!analysis) throw new Error("No beats detected");

  return new BeatGrid({
    anchors: analysis.anchors,
    trailingBpm: analysis.trailingBpm,
    beatsPerBar: analysis.beatsPerBar,
    downbeat: analysis.downbeat,
    confidence: analysis.confidence,
    source: "auto",
  });
};
