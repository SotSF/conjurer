import type { Store } from "@/src/types/Store";
import { Block } from "@/src/types/Block";
import type { EffectTrack } from "@/src/types/EffectTrack";
import type { Variation } from "@/src/types/Variations/Variation";

export type ActivePatternsWindow = {
  startTime: number;
  endTime: number;
  patterns: string[];
};

export type Layer = {
  // discriminates the two kinds of timeline row a block can belong to: a
  // compositing layer's pattern blocks, or an effect track's chain blocks
  kind: "layer" | "effectTrack";
  id: string;
  name: string;
  visible: boolean;
  // editor-only: when true the layer's timeline row shrinks to just its header
  // (its blocks are hidden from the timeline). Distinct from `visible`, which
  // controls whether the layer renders to the canopy. Not serialized.
  collapsed: boolean;
  height: number;
  // height of the blocks alone, without the effect track strip beneath them
  blockLanesHeight: number;
  // effects applied to everything the layer composites. Null only on an effect
  // track itself, which is what makes a track a leaf rather than a nesting point.
  effectTrack: EffectTrack | null;
  store: Store;

  insertCloneOfBlock(block: Block): void;
  addBlock(block: Block): void;
  removeBlock(block: Block): void;
  attemptMoveBlock(block: Block, desiredTime: number, relative?: boolean): void;
  getAllBlocks(): Block[];

  getNextValidStartAndDuration(
    fromTime: number,
    maxDuration: number,
  ): { startTime: number; duration: number };

  resizeBlockLeftBound(block: Block, delta: number): void;
  resizeBlockRightBound(block: Block, delta: number): void;
  // blocks report their rendered height so the layer can size itself
  reportBlockHeight(block: Block, heightPx: number): void;
  // the opacity the render pipeline applies to a block's final output when
  // the block has no manually-authored opacity variations (auto crossfade)
  autoBlockOpacityAt(block: Block, globalTime: number): number;
  // that same auto crossfade expressed as variations (null when the block has
  // no overlaps and therefore no auto fade); used for display and for
  // materializing into manually-editable variations
  autoOpacityVariations(block: Block): Variation<number>[] | null;
  // vertical pixel offset of the block within the layer's timeline row (blocks
  // overlapping in time are displayed stacked in lanes)
  blockTopOffset(block: Block): number;
  serialize(): object;
};
