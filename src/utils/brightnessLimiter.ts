/** Default brightness limiter settings (runtime values live on Store; not persisted). */

export const DEFAULT_BRIGHTNESS_LIMITER_ENABLED = true;

/** Target average Rec.709 luminance (0–1) of canopy LEDs. */
export const DEFAULT_BRIGHTNESS_LIMIT_THRESHOLD = 0.5;

/** Seconds for gain-reduction envelope to release toward unity. Attack is instant. */
export const DEFAULT_BRIGHTNESS_LIMITER_RELEASE_SEC = 2;

const LUMA_R = 0.299;
const LUMA_G = 0.587;
const LUMA_B = 0.114;

/** Average Rec.709 luminance over an RGBA8 buffer (every pixel is a canopy LED). */
export const averageCanopyLuminance = (pixels: Uint8Array): number => {
  const pixelCount = pixels.length / 4;
  if (pixelCount === 0) return 0;

  let sum = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    sum +=
      (pixels[i]! * LUMA_R + pixels[i + 1]! * LUMA_G + pixels[i + 2]! * LUMA_B) /
      255;
  }
  return sum / pixelCount;
};

/**
 * Classic limiter envelope: instant attack when average exceeds threshold,
 * exponential release back toward unity when under.
 */
export const updateBrightnessLimiterGain = (
  currentGain: number,
  averageLuma: number,
  threshold: number,
  releaseSec: number,
  dtSec: number,
): number => {
  const desiredGain = Math.min(1, threshold / Math.max(averageLuma, 1e-5));
  if (desiredGain < currentGain) return desiredGain;

  const alpha = 1 - Math.exp(-Math.max(dtSec, 0) / Math.max(releaseSec, 1e-5));
  return currentGain + (desiredGain - currentGain) * alpha;
};
