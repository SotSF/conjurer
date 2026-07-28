import type { Block } from "@/src/types/Block";
import type { Variation } from "@/src/types/Variations/Variation";
import { CurveVariation } from "@/src/types/Variations/CurveVariation";
import { MINIMUM_VARIATION_DURATION } from "@/src/utils/time";

// A span narrower than this is treated as a stray click, not a selection. It
// matches the narrowest region the lane can hold, since anything smaller could
// not be materialized by a replace/paste anyway.
export const MINIMUM_SPAN_DURATION = MINIMUM_VARIATION_DURATION;

export type LaneRegion = {
  variation: Variation;
  /** Lane-local start/end time of the region. */
  startTime: number;
  endTime: number;
};

/** Each region of a lane with its lane-local time bounds, in order. */
export const laneRegions = (
  block: Block,
  uniformName: string,
): LaneRegion[] => {
  const variations = block.parameterVariations[uniformName] ?? [];
  const regions: LaneRegion[] = [];
  let acc = 0;
  for (const variation of variations) {
    regions.push({
      variation,
      startTime: acc,
      endTime: acc + variation.duration,
    });
    acc += variation.duration;
  }
  return regions;
};

/** Total lane time — always the block/lane span, since the lane is kept full. */
export const laneDuration = (block: Block, uniformName: string) =>
  (block.parameterVariations[uniformName] ?? []).reduce(
    (total, variation) => total + variation.duration,
    0,
  );

/** The lane's value at lane-local time `t`, across whatever region covers it. */
export const laneValueAt = (
  block: Block,
  uniformName: string,
  t: number,
): unknown => {
  const regions = laneRegions(block, uniformName);
  if (regions.length === 0) return block.pattern.params[uniformName]?.value;
  const region =
    regions.find(({ endTime }) => t < endTime) ?? regions[regions.length - 1];
  const local = Math.max(
    0,
    Math.min(region.variation.duration, t - region.startTime),
  );
  return region.variation.valueAtTime(local, block.startTime + t);
};

/**
 * Clamp a raw span to the lane and make it selectable.
 *
 * Only Curve regions support a partial selection — their shape can be cut and
 * re-joined faithfully. Every other region type (LFO, audio, palette, color) is
 * a generator with no interior structure to slice, so a span that touches one
 * swallows it whole. That keeps "select part of an LFO" from silently meaning
 * "resample the LFO", at the cost of a span that sometimes grows past where the
 * pointer was released.
 *
 * Returns null when the result is too narrow to be a real selection.
 */
export const normalizeLaneSpan = (
  block: Block,
  uniformName: string,
  rawStart: number,
  rawEnd: number,
): { startTime: number; endTime: number } | null => {
  const regions = laneRegions(block, uniformName);
  if (regions.length === 0) return null;
  const total = regions[regions.length - 1].endTime;

  let startTime = Math.max(0, Math.min(total, Math.min(rawStart, rawEnd)));
  let endTime = Math.max(0, Math.min(total, Math.max(rawStart, rawEnd)));

  for (const region of regions) {
    if (region.variation instanceof CurveVariation) continue;
    // any overlap with an indivisible region pulls in the whole thing
    if (region.endTime <= startTime + 1e-9) continue;
    if (region.startTime >= endTime - 1e-9) continue;
    startTime = Math.min(startTime, region.startTime);
    endTime = Math.max(endTime, region.endTime);
  }

  if (endTime - startTime < MINIMUM_SPAN_DURATION) return null;
  return { startTime, endTime };
};

/**
 * Lane-local times a span edge should snap to while dragging: region seams and
 * every Curve node. Snapping to nodes is what makes it practical to grab
 * exactly one hump of a curve.
 */
export const laneSnapTargets = (
  block: Block,
  uniformName: string,
): number[] => {
  const targets: number[] = [0];
  for (const { variation, startTime, endTime } of laneRegions(
    block,
    uniformName,
  )) {
    targets.push(endTime);
    if (variation instanceof CurveVariation)
      for (const node of variation.nodes) targets.push(startTime + node.time);
  }
  return targets;
};
