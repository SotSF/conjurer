import type { BeatGridAnchor } from "@/src/types/BeatGrid";
import { FRAME_CENTER_OFFSET_SECONDS } from "@/src/utils/beatDetection/onsetEnvelope";

/**
 * Worst grid error we are willing to leave unmodelled. Below this, a listener
 * cannot tell the grid from the music, so there is no reason to spend an
 * anchor on it.
 */
export const ANCHOR_TOLERANCE_SECONDS = 0.025;
const MAX_ANCHORS = 64;
/** Beats either side included when judging whether a split is warranted. */
const SPLIT_SMOOTHING = 2;

export type BeatPoint = { beat: number; time: number };

export type AnchorFit = {
  anchors: BeatGridAnchor[];
  trailingBpm: number;
  /** Largest time error between the fitted grid and a detected beat. */
  maxResidualSeconds: number;
};

/**
 * Turn beat frames into precise times, interpolating each onset peak to
 * sub-frame resolution. Analysis frames are ~23ms apart, which would otherwise
 * be the floor on grid accuracy.
 */
export const refineBeatTimes = (
  beatFrames: number[],
  strength: Float32Array,
  frameRate: number,
): number[] =>
  beatFrames.map((frame) => {
    const previous = strength[frame - 1];
    const current = strength[frame];
    const next = strength[frame + 1];
    let offset = 0;
    if (previous !== undefined && next !== undefined) {
      const curvature = previous - 2 * current + next;
      if (curvature < 0) {
        offset = (0.5 * (previous - next)) / curvature;
        if (!Number.isFinite(offset) || Math.abs(offset) > 0.5) offset = 0;
      }
    }
    return (frame + offset) / frameRate + FRAME_CENTER_OFFSET_SECONDS;
  });

/**
 * Number the detected beats. Normally each is one beat after the last, but a
 * dropped or doubled interval must advance the count by the right amount or
 * every subsequent beat would be mislabelled and the fit would be garbage.
 */
export const numberBeats = (beatTimes: number[]): BeatPoint[] => {
  if (beatTimes.length === 0) return [];

  const intervals = beatTimes
    .slice(1)
    .map((time, index) => time - beatTimes[index])
    .sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)] || 1;

  const points: BeatPoint[] = [{ beat: 0, time: beatTimes[0] }];
  for (let i = 1; i < beatTimes.length; i++) {
    const steps = Math.max(1, Math.round((beatTimes[i] - beatTimes[i - 1]) / median));
    points.push({ beat: points[i - 1].beat + steps, time: beatTimes[i] });
  }
  return points;
};

const timeOnSegment = (start: BeatPoint, end: BeatPoint, beat: number) => {
  const span = end.beat - start.beat;
  if (span === 0) return start.time;
  return start.time + ((beat - start.beat) * (end.time - start.time)) / span;
};

/**
 * Douglas-Peucker simplification of the beat-number vs time curve.
 *
 * That curve is a straight line for anything sequenced to a click and bends
 * gently for a live performance, so simplifying it to the fewest vertices that
 * keep every beat within `tolerance` yields exactly the anchors the grid needs
 * — one for a fixed-tempo track, more only where the music actually drifts.
 */
const simplify = (points: BeatPoint[], tolerance: number): BeatPoint[] => {
  if (points.length <= 2) return [...points];

  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;

  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    if (last <= first + 1) continue;

    // Deviations are smoothed over a few neighbors before choosing a split.
    // Judging on a single beat would let one jittery detection carve the song
    // into tempo sections; genuine drift moves a run of beats together.
    const deviations = new Float64Array(last - first + 1);
    for (let i = first; i <= last; i++)
      deviations[i - first] = Math.abs(
        points[i].time -
          timeOnSegment(points[first], points[last], points[i].beat),
      );

    let worst = -1;
    let worstDeviation = tolerance;
    for (let i = first + 1; i < last; i++) {
      const index = i - first;
      const windowStart = Math.max(0, index - SPLIT_SMOOTHING);
      const windowEnd = Math.min(deviations.length - 1, index + SPLIT_SMOOTHING);
      let sum = 0;
      for (let j = windowStart; j <= windowEnd; j++) sum += deviations[j];
      const smoothed = sum / (windowEnd - windowStart + 1);
      if (smoothed > worstDeviation) {
        worstDeviation = smoothed;
        worst = i;
      }
    }

    if (worst < 0) continue;
    keep[worst] = 1;
    stack.push([first, worst], [worst, last]);
  }

  return points.filter((_, index) => keep[index] === 1);
};

const maxResidual = (points: BeatPoint[], vertices: BeatPoint[]) => {
  let worst = 0;
  let segment = 0;
  for (const point of points) {
    while (
      segment < vertices.length - 2 &&
      vertices[segment + 1].beat < point.beat
    )
      segment++;
    const deviation = Math.abs(
      point.time -
        timeOnSegment(vertices[segment], vertices[segment + 1], point.beat),
    );
    if (deviation > worst) worst = deviation;
  }
  return worst;
};

/**
 * Fit a minimal anchor set to the detected beats.
 *
 * The final vertex becomes `trailingBpm` rather than an anchor: the segment
 * after the last anchor is unbounded, so it both reproduces the last fitted
 * segment exactly and extends the grid past the last detected beat.
 */
export const fitAnchors = (
  points: BeatPoint[],
  tolerance = ANCHOR_TOLERANCE_SECONDS,
): AnchorFit | null => {
  if (points.length < 4) return null;

  let vertices = simplify(points, tolerance);
  // A pathological envelope can ask for an anchor every few beats; loosening
  // the tolerance is better than shipping a grid nobody can edit.
  let currentTolerance = tolerance;
  while (vertices.length > MAX_ANCHORS && currentTolerance < 1) {
    currentTolerance *= 2;
    vertices = simplify(points, currentTolerance);
  }
  if (vertices.length < 2) return null;

  const last = vertices[vertices.length - 1];
  const secondToLast = vertices[vertices.length - 2];
  const secondsPerBeat =
    (last.time - secondToLast.time) / (last.beat - secondToLast.beat);
  if (!(secondsPerBeat > 0)) return null;

  return {
    anchors: vertices.slice(0, -1).map(({ time, beat }) => ({ time, beat })),
    trailingBpm: 60 / secondsPerBeat,
    maxResidualSeconds: maxResidual(points, vertices),
  };
};

/**
 * Pick which beat of the bar is beat one, by summing low-frequency onset
 * energy at each candidate phase. Bar starts are where the kick lands, and
 * low-band energy separates them from the other beats far more cleanly than
 * the full-spectrum envelope does.
 */
export const estimateDownbeat = (
  points: BeatPoint[],
  lowStrength: Float32Array,
  frameRate: number,
  beatsPerBar: number,
) => {
  // A kick spreads its energy over a few frames, and the beat time itself is
  // only accurate to about a frame, so sample a short window around each beat
  // rather than a single value that could miss the peak entirely.
  const radius = Math.max(1, Math.round(0.03 * frameRate));

  const totals = new Float64Array(beatsPerBar);
  for (const point of points) {
    const center = Math.round(
      (point.time - FRAME_CENTER_OFFSET_SECONDS) * frameRate,
    );
    let energy = 0;
    for (let frame = center - radius; frame <= center + radius; frame++) {
      if (frame < 0 || frame >= lowStrength.length) continue;
      energy += lowStrength[frame];
    }
    totals[((point.beat % beatsPerBar) + beatsPerBar) % beatsPerBar] += energy;
  }

  let best = 0;
  for (let phase = 1; phase < beatsPerBar; phase++)
    if (totals[phase] > totals[best]) best = phase;
  return best;
};
