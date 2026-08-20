import type { Block } from "@/src/types/Block";
import type { Store } from "@/src/types/Store";
import type { Variation } from "@/src/types/Variations/Variation";
import type { Layer } from "@/src/types/Layer";
import type { EffectTrack } from "@/src/types/EffectTrack";

/**
 * A timeline track: a row that holds blocks in time. A block's `layer`
 * back-reference points at its track, and this union is what that reference
 * narrows through — a compositing layer holding pattern blocks, or an effect
 * track holding effect chain blocks, discriminated by `kind`.
 */
export type Track = Layer | EffectTrack;

/**
 * The behavior every track provides: exactly what the timeline's block-driving
 * machinery (drag, resize, selection, height reporting, lane offsets) and the
 * block-routing store code reach through a block's track. Compositing concerns
 * — visibility, collapse, the layer's own effect track — live on `Layer`;
 * anything satisfying this contract gets the timeline block components for
 * free.
 */
export type TrackContract = {
  kind: "layer" | "effectTrack";
  id: string;
  name: string;
  store: Store;

  addBlock(block: Block): void;
  removeBlock(block: Block): void;
  insertCloneOfBlock(block: Block): void;
  getAllBlocks(): Block[];

  // where a block added at fromTime goes, and how long it can be
  getNextValidStartAndDuration(
    fromTime: number,
    maxDuration: number,
  ): { startTime: number; duration: number };

  attemptMoveBlock(block: Block, desiredTime: number, relative?: boolean): void;
  resizeBlockLeftBound(block: Block, delta: number): void;
  resizeBlockRightBound(block: Block, delta: number): void;

  // blocks report their rendered height so the track can size itself
  reportBlockHeight(block: Block, heightPx: number): void;
  // vertical pixel offset of the block within the track's timeline row
  blockTopOffset(block: Block): number;

  // the opacity the render pipeline applies to a block's final output when
  // the block has no manually-authored opacity variations (auto crossfade)
  autoBlockOpacityAt(block: Block, globalTime: number): number;
  // that same auto crossfade expressed as variations (null when the block has
  // no overlaps and therefore no auto fade)
  autoOpacityVariations(block: Block): Variation<number>[] | null;
};
