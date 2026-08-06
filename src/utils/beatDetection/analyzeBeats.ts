import { computeOnsetEnvelope } from "@/src/utils/beatDetection/onsetEnvelope";
import { estimateTempo } from "@/src/utils/beatDetection/tempo";
import { trackBeats } from "@/src/utils/beatDetection/beatTracker";
import {
  ANCHOR_TOLERANCE_SECONDS,
  estimateDownbeat,
  fitAnchors,
  numberBeats,
  refineBeatTimes,
} from "@/src/utils/beatDetection/fitAnchors";
import type { BeatGridAnchor } from "@/src/types/BeatGrid";

const DEFAULT_BEATS_PER_BAR = 4;

export type BeatAnalysis = {
  anchors: BeatGridAnchor[];
  trailingBpm: number;
  beatsPerBar: number;
  downbeat: number;
  confidence: number;
  /** Diagnostics, surfaced in the tempo panel. */
  beatCount: number;
  maxResidualSeconds: number;
};

/**
 * Full beat analysis of mono audio already resampled to the analysis rate.
 *
 * Pure and dependency-free so it can run either in a worker or, if workers are
 * unavailable, inline on the main thread.
 */
export const analyzeBeats = (samples: Float32Array): BeatAnalysis | null => {
  const { strength, lowStrength, frameRate } = computeOnsetEnvelope(samples);
  if (strength.length === 0) return null;

  const tempo = estimateTempo(strength, frameRate);
  if (!tempo.bpm) return null;

  const beatFrames = trackBeats(strength, frameRate, tempo.bpm);
  if (beatFrames.length < 4) return null;

  const points = numberBeats(refineBeatTimes(beatFrames, strength, frameRate));
  const fit = fitAnchors(points);
  if (!fit) return null;

  // Needing a looser tolerance than requested means the track wanders more
  // than the anchor budget could describe, so trust the result less.
  const fitQuality = Math.min(
    1,
    ANCHOR_TOLERANCE_SECONDS /
      Math.max(fit.maxResidualSeconds, ANCHOR_TOLERANCE_SECONDS),
  );

  return {
    anchors: fit.anchors,
    trailingBpm: fit.trailingBpm,
    beatsPerBar: DEFAULT_BEATS_PER_BAR,
    downbeat: estimateDownbeat(
      points,
      lowStrength,
      frameRate,
      DEFAULT_BEATS_PER_BAR,
    ),
    confidence: tempo.confidence * fitQuality,
    beatCount: points.length,
    maxResidualSeconds: fit.maxResidualSeconds,
  };
};
