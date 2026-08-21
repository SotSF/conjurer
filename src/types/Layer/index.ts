import type { EffectTrack } from "@/src/types/EffectTrack";
import type { TrackContract } from "@/src/types/Track";

export type ActivePatternsWindow = {
  startTime: number;
  endTime: number;
  patterns: string[];
};

/**
 * A compositing layer: the timeline track whose pattern blocks render to the
 * canopy. On top of the track behavior every timeline row shares (see
 * TrackContract), a layer carries the compositing concerns — visibility,
 * collapse, its own effect track — and serializes as part of the experience.
 */
export type Layer = TrackContract & {
  kind: "layer";
  visible: boolean;
  // editor-only: when true the layer's timeline row shrinks to just its header
  // (its blocks are hidden from the timeline). Distinct from `visible`, which
  // controls whether the layer renders to the canopy. Not serialized.
  collapsed: boolean;
  height: number;
  // height of the blocks alone, without the effect track strip beneath them
  blockLanesHeight: number;
  // effects applied to everything the layer composites, or null when the layer
  // version predates effect tracks
  effectTrack: EffectTrack | null;
  serialize(): object;
};
