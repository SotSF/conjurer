import { FFT } from "@/src/utils/beatDetection/fft";

// Analysis runs at a reduced rate: nothing above ~11 kHz helps locate a beat,
// and the cost of every stage scales with sample count.
export const ANALYSIS_SAMPLE_RATE = 22050;
export const FFT_SIZE = 1024;
// 75% overlap. The hop is the floor on how precisely a beat can be placed, and
// halving it costs well under a second on a full-length track.
export const HOP_SIZE = 256;
export const FRAME_RATE = ANALYSIS_SAMPLE_RATE / HOP_SIZE; // ~86 frames/sec

/**
 * Frame `f` analyzes samples [f*hop, f*hop + fftSize), and the Hann window
 * weights that span toward its center, so a transient registers when it
 * reaches the middle of the window rather than the start of it. Without this
 * correction every detected beat sits half a window early — a fixed ~23ms
 * lead that no amount of averaging would remove.
 */
export const FRAME_CENTER_OFFSET_SECONDS =
  FFT_SIZE / 2 / ANALYSIS_SAMPLE_RATE;

const BAND_COUNT = 64;
const MIN_BAND_HZ = 30;
const MAX_BAND_HZ = 10000;
// Kicks live here, and they mark bar starts far more reliably than the full
// spectrum does — used only for picking the downbeat.
const LOW_BAND_MAX_HZ = 200;
const LOG_COMPRESSION = 1000;

export type OnsetEnvelope = {
  /** Spectral-flux onset strength, one value per frame, mean-removed. */
  strength: Float32Array;
  /** Same, restricted to low frequencies, for downbeat picking. */
  lowStrength: Float32Array;
  frameRate: number;
};

/** Average all channels to mono and resample to the analysis rate. */
export const toMonoAtAnalysisRate = (audioBuffer: AudioBuffer): Float32Array => {
  const channelCount = audioBuffer.numberOfChannels;
  const sourceLength = audioBuffer.length;
  const channels: Float32Array[] = [];
  for (let channel = 0; channel < channelCount; channel++)
    channels.push(audioBuffer.getChannelData(channel));

  const ratio = audioBuffer.sampleRate / ANALYSIS_SAMPLE_RATE;
  const targetLength = Math.floor(sourceLength / ratio);
  const output = new Float32Array(targetLength);

  for (let i = 0; i < targetLength; i++) {
    // Linear interpolation is enough here: the envelope is smoothed over
    // 1024-sample windows, so resampling artifacts never reach the result.
    const position = i * ratio;
    const index = Math.floor(position);
    const fraction = position - index;
    const next = Math.min(index + 1, sourceLength - 1);
    let sum = 0;
    for (let channel = 0; channel < channelCount; channel++) {
      const data = channels[channel];
      sum += data[index] * (1 - fraction) + data[next] * fraction;
    }
    output[i] = sum / channelCount;
  }

  return output;
};

const buildBandEdges = () => {
  const edges = new Int32Array(BAND_COUNT + 1);
  const binsPerHz = FFT_SIZE / ANALYSIS_SAMPLE_RATE;
  const logMin = Math.log(MIN_BAND_HZ);
  const logMax = Math.log(MAX_BAND_HZ);
  for (let band = 0; band <= BAND_COUNT; band++) {
    const hz = Math.exp(logMin + ((logMax - logMin) * band) / BAND_COUNT);
    edges[band] = Math.min(FFT_SIZE / 2, Math.max(1, Math.round(hz * binsPerHz)));
  }
  return edges;
};

/**
 * Spectral flux onset strength, the standard front end for beat tracking.
 *
 * Log-compressed band magnitudes are differenced frame to frame and
 * half-wave rectified, so the result responds to *increases* in energy
 * regardless of absolute level. That local normalization is what makes this
 * work on quiet and heavily-limited masters alike, and it responds to hats,
 * snares and synth stabs rather than only to kick drums.
 *
 * The previous frame is max-filtered across neighboring bands before
 * differencing (the SuperFlux trick), which stops vibrato and portamento from
 * registering as onsets.
 */
export const computeOnsetEnvelope = (samples: Float32Array): OnsetEnvelope => {
  const fft = new FFT(FFT_SIZE);
  const frameCount = Math.max(
    0,
    Math.floor((samples.length - FFT_SIZE) / HOP_SIZE) + 1,
  );
  if (frameCount <= 0)
    return {
      strength: new Float32Array(0),
      lowStrength: new Float32Array(0),
      frameRate: FRAME_RATE,
    };

  const window = new Float64Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++)
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / FFT_SIZE);

  const bandEdges = buildBandEdges();
  const binsPerHz = FFT_SIZE / ANALYSIS_SAMPLE_RATE;
  const lowBandLimit = LOW_BAND_MAX_HZ * binsPerHz;
  let lowBandCount = 0;
  while (
    lowBandCount < BAND_COUNT &&
    bandEdges[lowBandCount + 1] <= lowBandLimit
  )
    lowBandCount++;
  lowBandCount = Math.max(1, lowBandCount);

  const real = new Float64Array(FFT_SIZE);
  const imag = new Float64Array(FFT_SIZE);
  let bands = new Float32Array(BAND_COUNT);
  let previousBands = new Float32Array(BAND_COUNT);
  const maxFiltered = new Float32Array(BAND_COUNT);

  const strength = new Float32Array(frameCount);
  const lowStrength = new Float32Array(frameCount);

  for (let frame = 0; frame < frameCount; frame++) {
    const offset = frame * HOP_SIZE;
    for (let i = 0; i < FFT_SIZE; i++) {
      real[i] = samples[offset + i] * window[i];
      imag[i] = 0;
    }
    fft.transform(real, imag);

    for (let band = 0; band < BAND_COUNT; band++) {
      const start = bandEdges[band];
      const end = Math.max(start + 1, bandEdges[band + 1]);
      let sum = 0;
      for (let bin = start; bin < end; bin++)
        sum += Math.sqrt(real[bin] * real[bin] + imag[bin] * imag[bin]);
      bands[band] = Math.log1p((LOG_COMPRESSION * sum) / (end - start));
    }

    if (frame > 0) {
      for (let band = 0; band < BAND_COUNT; band++) {
        const low = Math.max(0, band - 1);
        const high = Math.min(BAND_COUNT - 1, band + 1);
        let peak = previousBands[low];
        for (let neighbor = low + 1; neighbor <= high; neighbor++)
          if (previousBands[neighbor] > peak) peak = previousBands[neighbor];
        maxFiltered[band] = peak;
      }

      let total = 0;
      let lowTotal = 0;
      for (let band = 0; band < BAND_COUNT; band++) {
        const rise = bands[band] - maxFiltered[band];
        if (rise <= 0) continue;
        total += rise;
        if (band < lowBandCount) lowTotal += rise;
      }
      strength[frame] = total;
      lowStrength[frame] = lowTotal;
    }

    const swap = previousBands;
    previousBands = bands;
    bands = swap;
  }

  removeLocalMean(strength);
  removeLocalMean(lowStrength);
  normalize(strength);
  normalize(lowStrength);

  return { strength, lowStrength, frameRate: FRAME_RATE };
};

/**
 * Subtract a ~1s moving average and rectify. This is what makes a quiet
 * breakdown and a loud drop contribute comparably, instead of the loudest
 * section dominating the tempo estimate.
 */
const removeLocalMean = (values: Float32Array) => {
  const radius = Math.round(FRAME_RATE / 2);
  const length = values.length;
  if (length === 0) return;

  const prefix = new Float64Array(length + 1);
  for (let i = 0; i < length; i++) prefix[i + 1] = prefix[i] + values[i];

  for (let i = 0; i < length; i++) {
    const start = Math.max(0, i - radius);
    const end = Math.min(length, i + radius + 1);
    const mean = (prefix[end] - prefix[start]) / (end - start);
    const centered = values[i] - mean;
    values[i] = centered > 0 ? centered : 0;
  }
};

const normalize = (values: Float32Array) => {
  let sum = 0;
  for (let i = 0; i < values.length; i++) sum += values[i];
  if (sum <= 0) return;
  const mean = sum / values.length;
  let variance = 0;
  for (let i = 0; i < values.length; i++)
    variance += (values[i] - mean) * (values[i] - mean);
  const deviation = Math.sqrt(variance / values.length);
  if (deviation <= 0) return;
  for (let i = 0; i < values.length; i++) values[i] /= deviation;
};
