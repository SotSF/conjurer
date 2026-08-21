import { makeAutoObservable } from "mobx";
import type { Store } from "@/src/types/Store";
import { BlockHeightReporter } from "@/src/utils/BlockHeightReporter";
import type { Layer } from "@/src/types/Layer";
import type { TrackContract } from "@/src/types/Track";
import { Block } from "@/src/types/Block";
import type { Pattern } from "@/src/types/Pattern";
import type { Variation } from "@/src/types/Variations/Variation";
import { generateId } from "@/src/utils/id";
import {
  DEFAULT_BLOCK_DURATION,
  MINIMUM_VARIATION_DURATION,
} from "@/src/utils/time";
import { EffectChainSource } from "@/src/patterns/EffectChainSource";

// used for a block's lane until its actual rendered height is reported
const UNMEASURED_BLOCK_HEIGHT = 50;

/**
 * A timeline track holding the effects applied to already-composited output —
 * either one layer's merged blocks or the entire layer stack.
 *
 * A track holds effect chain blocks the way a layer holds pattern blocks, and
 * each block holds a chain of effects: the block owns the time bounds, and the
 * effects inside it share those bounds and run in the order they are stacked.
 * Blocks never overlap, so the track's own ordering is purely chronological and
 * carries no signal meaning.
 *
 * It implements TrackContract, which is what lets the timeline's block
 * components (drag, resize, selection, automation lanes) drive effect chain
 * blocks through the same code paths they use for pattern blocks.
 */
export class EffectTrack implements TrackContract {
  readonly kind = "effectTrack";
  id = generateId();
  name: string;
  // editor-only bypass: false takes the whole track out of the signal path
  visible = true;

  blocks: Block[] = [];

  // rendered block heights in px, reported from the DOM as blocks
  // mount/resize (see reportBlockHeight)
  blockHeights = new BlockHeightReporter();

  _activeBlocks: Block[] = [];

  constructor(
    readonly store: Store,
    name: string,
    // the layer whose composited output this track processes; null for the
    // global track, which processes the whole merged frame
    readonly layer: Layer | null = null,
  ) {
    this.name = name;
    makeAutoObservable(this, {
      store: false,
      layer: false,
      blockHeights: false,
      _activeBlocks: false,
    });
  }

  /**
   * The blocks in the signal path at the playhead, in track order.
   *
   * The array identity is held stable while the membership is unchanged, so the
   * render pipeline's observers see an unchanged computed value and don't
   * re-render on every frame the playhead advances.
   */
  get activeBlocks(): Block[] {
    const { globalTime } = this.store.audioStore;
    const active = this.visible
      ? this.blocks.filter(
          (block) =>
            block.startTime <= globalTime && globalTime < block.endTime,
        )
      : [];

    const previous = this._activeBlocks;
    if (
      active.length === previous.length &&
      active.every((block, i) => block === previous[i])
    )
      return previous;

    this._activeBlocks = active;
    return active;
  }

  // Blocks never overlap, so the track is a single lane exactly as tall as its
  // tallest block. An empty track takes up no vertical space at all, so a
  // layer with no effects lays out exactly as it would without the feature.
  get height() {
    let height = 0;
    for (const block of this.blocks)
      height = Math.max(
        height,
        this.blockHeights.heights.get(block.id) ?? UNMEASURED_BLOCK_HEIGHT,
      );
    return height;
  }

  // every block sits at the top of the track's single lane
  blockTopOffset = () => 0;

  reportBlockHeight = (block: Block, heightPx: number) =>
    this.blockHeights.report(block.id, heightPx);

  toggleVisible = () => {
    this.visible = !this.visible;
  };

  /**
   * Starts a new effect chain block at the playhead holding this effect.
   *
   * Effects live inside a chain block rather than alongside it, so this is how
   * a track gains a block; further effects are stacked onto an existing one
   * through Block.addCloneOfEffect.
   */
  addCloneOfEffect = (effect: Pattern) => {
    const { startTime, duration } = this.getNextValidStartAndDuration(
      this.store.audioStore.globalTime,
      DEFAULT_BLOCK_DURATION,
    );
    const block = new Block(this.store, EffectChainSource());
    block.setTiming({ startTime, duration });
    this.addBlock(block);
    block.addCloneOfEffect(effect);
    return block;
  };

  // kept in start time order, which is the only order an effect chain block
  // has: its effects carry the signal order, and blocks never overlap
  addBlock = (block: Block) => {
    block.layer = this;
    const index = this.blocks.findIndex((b) => b.startTime > block.startTime);
    if (index === -1) this.blocks.push(block);
    else this.blocks.splice(index, 0, block);
  };

  removeBlock = (block: Block) => {
    const index = this.blocks.indexOf(block);
    if (index === -1) return;
    this.blocks.splice(index, 1);
    block.layer = null;
  };

  insertCloneOfBlock = (block: Block) => {
    const clone = block.clone();
    clone.regenerateId();
    const { startTime, duration } = this.getNextValidStartAndDuration(
      this.store.audioStore.globalTime,
      block.duration,
    );
    clone.setTiming({ startTime, duration });
    this.addBlock(clone);
  };

  getAllBlocks() {
    return this.blocks.slice();
  }

  // The first gap at or after fromTime that no block occupies. Effect chain
  // blocks apply in series to the same composited input, so overlapping them
  // would leave their order to something the timeline cannot show.
  /**
   * Where a block added at fromTime goes, and how long it can be.
   *
   * A gap too short for the requested duration shortens the block instead of
   * moving it: a short block at the playhead is far closer to what was asked
   * for than a full-length one somewhere the playhead isn't. The start moves
   * only when the playhead has no room at all — inside a block, or in a gap too
   * small to hold one.
   */
  getNextValidStartAndDuration(fromTime: number, maxDuration: number) {
    let startTime = fromTime;
    for (const block of this.blocks) {
      if (block.endTime <= startTime) continue;
      if (block.startTime - startTime >= MINIMUM_VARIATION_DURATION) break;
      startTime = block.endTime;
    }

    const next = this.blocks.find((b) => b.startTime > startTime);
    const available = next ? next.startTime - startTime : Infinity;
    return { startTime, duration: Math.min(maxDuration, available) };
  }

  // the blocks either side of the given one in time, which bound its move and
  // resize range
  private neighborsOf = (block: Block) => {
    let previous: Block | null = null;
    let next: Block | null = null;
    for (const other of this.blocks) {
      if (other === block) continue;
      if (other.startTime < block.startTime) {
        if (!previous || other.startTime > previous.startTime) previous = other;
      } else if (!next || other.startTime < next.startTime) next = other;
    }
    return { previous, next };
  };

  attemptMoveBlock = (block: Block, desiredTime: number, relative = false) => {
    if (block.layer != this || block.locked) return;

    const desiredStartTime = relative
      ? block.startTime + desiredTime
      : desiredTime;
    const { previous, next } = this.neighborsOf(block);
    const lowerBound = previous?.endTime ?? 0;
    const upperBound = (next?.startTime ?? Infinity) - block.duration;
    if (upperBound < lowerBound) return;

    block.startTime = Math.min(
      Math.max(desiredStartTime, lowerBound),
      upperBound,
    );
    // start time decides position in the track's ordering
    this.blocks.splice(this.blocks.indexOf(block), 1);
    this.addBlock(block);
  };

  resizeBlockLeftBound = (block: Block, delta: number) => {
    if (block.layer != this || block.locked) return;

    const desiredStartTime = block.startTime + delta;
    if (desiredStartTime >= block.endTime) return;

    const lowerBound = this.neighborsOf(block).previous?.endTime ?? 0;
    const startTime = Math.max(desiredStartTime, lowerBound);
    block.duration = block.endTime - startTime;
    block.startTime = startTime;
  };

  resizeBlockRightBound = (block: Block, delta: number) => {
    if (block.layer != this || block.locked) return;

    const desiredEndTime = block.endTime + delta;
    if (desiredEndTime <= block.startTime) return;

    const upperBound = this.neighborsOf(block).next?.startTime ?? Infinity;
    block.duration = Math.min(desiredEndTime, upperBound) - block.startTime;
  };

  // Effect chain blocks are applied in series rather than summed, so there is
  // no crossfade between them to derive.
  autoBlockOpacityAt = () => 1;
  autoOpacityVariations = (): Variation<number>[] | null => null;

  serialize = () => ({
    id: this.id,
    blocks: this.blocks.map((block) => block.serialize()),
  });

  static deserialize = (
    store: Store,
    name: string,
    data: any,
    layer: Layer | null = null,
  ) => {
    const track = new EffectTrack(store, name, layer);
    if (data?.id) track.id = data.id;
    for (const blockData of data?.blocks ?? [])
      track.addBlock(Block.deserialize(store, blockData));
    return track;
  };
}
