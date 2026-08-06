// How hard the tracker resists intervals that stray from the target period.
// High values keep the beat rigid through sparse passages; too high and it
// cannot follow a genuine tempo change.
const TIGHTNESS = 100;

/**
 * Ellis's dynamic-programming beat tracker.
 *
 * Chooses the beat sequence maximizing total onset strength at the chosen
 * positions, minus a penalty on every interval that deviates from the target
 * period. Because it optimizes over the whole song at once rather than
 * greedily following peaks, a handful of missing or misleading onsets — a
 * breakdown, a fill, a silent bar — cannot knock it off the beat.
 *
 * Returns the frame index of every beat.
 */
export const trackBeats = (
  strength: Float32Array,
  frameRate: number,
  bpm: number,
): number[] => {
  const frameCount = strength.length;
  const period = (60 / bpm) * frameRate;
  if (!(period > 1) || frameCount < period * 4) return [];

  const earliest = Math.round(2 * period);
  const latest = Math.max(1, Math.round(period / 2));
  const candidateCount = earliest - latest + 1;
  if (candidateCount <= 0) return [];

  // Penalty for each possible gap back to the previous beat, precomputed once.
  const transitionPenalty = new Float64Array(candidateCount);
  for (let i = 0; i < candidateCount; i++) {
    const gap = latest + i;
    const deviation = Math.log(gap / period);
    transitionPenalty[i] = -TIGHTNESS * deviation * deviation;
  }

  const cumulative = new Float64Array(frameCount);
  const backlink = new Int32Array(frameCount).fill(-1);

  for (let frame = 0; frame < frameCount; frame++) {
    let bestScore = -Infinity;
    let bestPrevious = -1;
    for (let i = 0; i < candidateCount; i++) {
      const previous = frame - (latest + i);
      if (previous < 0) continue;
      const score = cumulative[previous] + transitionPenalty[i];
      if (score > bestScore) {
        bestScore = score;
        bestPrevious = previous;
      }
    }

    // No viable predecessor (or every one scores negatively) means this frame
    // is better treated as the opening beat than as a continuation.
    if (bestPrevious < 0 || bestScore < 0) {
      cumulative[frame] = strength[frame];
      backlink[frame] = -1;
    } else {
      cumulative[frame] = strength[frame] + bestScore;
      backlink[frame] = bestPrevious;
    }
  }

  let end = 0;
  for (let frame = 1; frame < frameCount; frame++)
    if (cumulative[frame] > cumulative[end]) end = frame;

  const beats: number[] = [];
  for (let frame = end; frame >= 0; frame = backlink[frame]) {
    beats.push(frame);
    if (backlink[frame] < 0) break;
  }
  return beats.reverse();
};
