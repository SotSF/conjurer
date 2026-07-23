import { Block } from "@/src/types/Block";
import { Variation } from "@/src/types/Variations/Variation";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const valueOverVariations = (
  variations: Variation[],
  localTime: number,
  globalTime: number,
): number => {
  let t = localTime;
  for (const variation of variations) {
    if (t < variation.duration) {
      const value = variation.valueAtTime(t, globalTime);
      return typeof value === "number" ? value : 1;
    }
    t -= variation.duration;
  }
  // past the end: hold the last variation's final value
  const last = variations[variations.length - 1];
  if (!last) return 1;
  const value = last.valueAtTime(last.duration, globalTime);
  return typeof value === "number" ? value : 1;
};

export type OpacitySample = { x: number; y: number };

// Samples a block's effective opacity across its own duration, whether that
// comes from manually-authored variations or the layer's auto crossfade.
// x is the fraction of the block duration [0,1]; y is opacity [0,1].
export const sampleBlockOpacity = (
  block: Block,
  sampleCount = 48,
): OpacitySample[] => {
  const manual = block.hasManualOpacity
    ? (block.parameterVariations["u_opacity"] ?? [])
    : null;
  const points: OpacitySample[] = [];
  for (let i = 0; i <= sampleCount; i++) {
    const x = i / sampleCount;
    const localTime = x * block.duration;
    const globalTime = block.startTime + localTime;
    const y = manual
      ? valueOverVariations(manual, localTime, globalTime)
      : (block.layer?.autoBlockOpacityAt(block, globalTime) ?? 1);
    points.push({ x, y: clamp01(y) });
  }
  return points;
};

// The leading fade-in and trailing fade-out extents of a block's opacity,
// expressed as fractions of block duration (null when there is no fade on that
// side). Detected from the sampled curve: a leading stretch rising to 1, and a
// trailing stretch falling from 1.
export const opacityFadeExtents = (
  block: Block,
): { fadeInEnd: number | null; fadeOutStart: number | null } => {
  const samples = sampleBlockOpacity(block);
  const full = 0.999;

  let fadeInEnd: number | null = null;
  if (samples[0] && samples[0].y < full) {
    const idx = samples.findIndex((s) => s.y >= full);
    fadeInEnd = idx === -1 ? 1 : samples[idx].x;
  }

  let fadeOutStart: number | null = null;
  const lastSample = samples[samples.length - 1];
  if (lastSample && lastSample.y < full) {
    let idx = samples.length - 1;
    while (idx > 0 && samples[idx - 1].y < full) idx--;
    fadeOutStart = samples[idx].x;
  }

  return { fadeInEnd, fadeOutStart };
};
