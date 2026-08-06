const MIN_BPM = 40;
const MAX_BPM = 250;
// Perceptual tempo prior. Autocorrelation cannot tell 70 from 140 from 280 BPM
// on its own — they are all genuinely periodic — so the octave is chosen by how
// likely a tempo is a priori rather than by clamping into a fixed range.
const PRIOR_CENTER_BPM = 125;
const PRIOR_WIDTH_OCTAVES = 0.9;
const BPM_SEARCH_STEP = 0.05;
// A rival peak this close to the winner is the same tempo, not competition.
const RIVAL_EXCLUSION = 0.08;
/**
 * How strongly double the chosen tempo must correlate before we conclude the
 * beat is really at that faster level. A backbeat or a two-bar pattern makes
 * half-tempo correlate well on its own, which no prior centered between the
 * two octaves can distinguish — but if the faster level is supported nearly as
 * strongly, every one of its pulses is a real onset, and that is the beat.
 */
const FASTER_LEVEL_THRESHOLD = 0.92;

export type TempoEstimate = {
  bpm: number;
  /** 0-1. Low values mean a rival tempo (usually an octave) scored nearly as well. */
  confidence: number;
};

/**
 * Unbiased autocorrelation of the onset envelope at integer frame lags.
 * A periodic pulse train in the envelope produces a peak at the beat period.
 */
const autocorrelate = (strength: Float32Array, maxLag: number) => {
  const result = new Float64Array(maxLag + 1);
  const length = strength.length;
  for (let lag = 1; lag <= maxLag; lag++) {
    const overlap = length - lag;
    if (overlap <= 0) break;
    let sum = 0;
    for (let i = 0; i < overlap; i++) sum += strength[i] * strength[i + lag];
    result[lag] = sum / overlap;
  }
  return result;
};

const interpolate = (values: Float64Array, lag: number) => {
  if (lag <= 1) return values[1] ?? 0;
  const index = Math.floor(lag);
  if (index + 1 >= values.length) return values[values.length - 1] ?? 0;
  const fraction = lag - index;
  return values[index] * (1 - fraction) + values[index + 1] * fraction;
};

/**
 * Strongest correlation within a frame either side of `lag`. Comparing raw
 * interpolated values at two lags is unfair to whichever one happens to fall
 * between integer samples, since linear interpolation always undershoots a
 * peak — and the octave decision turns on differences of a few percent.
 */
const peakNear = (values: Float64Array, lag: number) => {
  let peak = 0;
  const first = Math.max(1, Math.floor(lag) - 1);
  const last = Math.min(values.length - 1, Math.ceil(lag) + 1);
  for (let i = first; i <= last; i++) if (values[i] > peak) peak = values[i];
  return peak;
};

const tempoPrior = (bpm: number) => {
  const octaves = Math.log2(bpm / PRIOR_CENTER_BPM) / PRIOR_WIDTH_OCTAVES;
  return Math.exp(-0.5 * octaves * octaves);
};

/**
 * Pick the most likely tempo from the onset envelope: autocorrelation weighted
 * by the tempo prior.
 *
 * Deliberately no reinforcement from multiples of the period. Every tempo's
 * multiples are also periodic — a track with a two-bar pattern has strong
 * correlation at half and quarter tempo — so summing them systematically
 * favors slower readings, which is the wrong way to lean when detecting half
 * the true tempo is the failure mode that actually happens.
 */
export const estimateTempo = (
  strength: Float32Array,
  frameRate: number,
): TempoEstimate => {
  const maxLag = Math.ceil(((60 / MIN_BPM) * frameRate * 2) + 2);
  if (strength.length < maxLag * 2) return { bpm: 0, confidence: 0 };

  const correlation = autocorrelate(strength, maxLag);

  const candidates: { bpm: number; score: number }[] = [];
  for (let bpm = MIN_BPM; bpm <= MAX_BPM; bpm += BPM_SEARCH_STEP) {
    const lag = (60 / bpm) * frameRate;
    const score = interpolate(correlation, lag) * tempoPrior(bpm);
    candidates.push({ bpm, score });
  }

  let best = candidates[0];
  for (const candidate of candidates)
    if (candidate.score > best.score) best = candidate;
  if (!best || best.score <= 0) return { bpm: 0, confidence: 0 };

  // Confidence comes from the weighted search, before any octave override: a
  // close call between two metrical levels should read as uncertain whichever
  // one we end up choosing.
  let rival = 0;
  for (const candidate of candidates) {
    const ratio = candidate.bpm / best.bpm;
    if (Math.abs(ratio - 1) < RIVAL_EXCLUSION) continue;
    if (candidate.score > rival) rival = candidate.score;
  }
  const confidence = Math.max(0, Math.min(1, 1 - rival / best.score));

  let bpm = best.bpm;
  while (bpm * 2 <= MAX_BPM) {
    const current = peakNear(correlation, (60 / bpm) * frameRate);
    const faster = peakNear(correlation, (60 / (bpm * 2)) * frameRate);
    if (faster < FASTER_LEVEL_THRESHOLD * current) break;
    bpm *= 2;
  }

  return { bpm, confidence };
};
