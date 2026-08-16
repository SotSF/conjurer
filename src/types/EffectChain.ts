import { makeAutoObservable, runInAction } from "mobx";
import type { Store } from "@/src/types/Store";
import type { Layer } from "@/src/types/Layer";
import { Block } from "@/src/types/Block";
import type { Pattern } from "@/src/types/Pattern";
import type { Variation } from "@/src/types/Variations/Variation";
import { generateId } from "@/src/utils/id";
import { DEFAULT_BLOCK_DURATION } from "@/src/utils/time";
import { EffectChainSource } from "@/src/patterns/EffectChainSource";

// used for a block's lane until its actual rendered height is reported
const UNMEASURED_BLOCK_HEIGHT = 50;

/**
 * The effects applied to already-composited output — either one layer's merged
 * blocks or the entire layer stack.
 *
 * A chain holds blocks the way a layer does, and each block holds a stack of
 * effects the way a pattern block does: the block owns the time bounds, and the
 * effects inside it share those bounds and run in the order they are stacked.
 * Blocks never overlap, so the chain's own ordering is purely chronological and
 * carries no signal meaning.
 *
 * It implements Layer so that the timeline's block components (drag, resize,
 * selection, automation lanes) drive chain blocks through the same code paths
 * they use for pattern blocks. A chain is never in `store.layers`, so it never
 * composites as a layer.
 */
export class EffectChain implements Layer {
  id = generateId();
  name: string;
  // editor-only bypass: false takes the whole chain out of the signal path
  visible = true;
  // satisfies Layer; a chain strip has no collapsed state of its own
  collapsed = false;
  // a chain is the end of the line: its own blocks carry no further chain
  effectChain = null;

  blocks: Block[] = [];

  // rendered block heights in px, reported from the DOM as blocks
  // mount/resize (see reportBlockHeight)
  blockHeights = new Map<string, number>();

  _activeBlocks: Block[] = [];

  // Buffered height reports, applied together once per frame. Deliberately not
  // observable — this is bookkeeping for the flush, not state anything renders.
  _pendingHeights = new Map<string, number>();
  _heightFlushHandle: number | null = null;

  constructor(
    readonly store: Store,
    name: string,
  ) {
    this.name = name;
    makeAutoObservable(this, {
      store: false,
      _activeBlocks: false,
      _pendingHeights: false,
      _heightFlushHandle: false,
    });
  }

  /**
   * The blocks in the signal path at the playhead, in chain order.
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

  // Overlapping blocks are displayed stacked in "lanes" within the chain strip.
  // Greedy interval partitioning: in start time order, each block goes into the
  // first lane whose previous block has ended.
  get blockLanes(): Map<string, number> {
    const sorted = this.blocks
      .slice()
      .sort((a, b) => a.startTime - b.startTime || a.id.localeCompare(b.id));
    const laneEndTimes: number[] = [];
    const lanes = new Map<string, number>();
    for (const block of sorted) {
      let lane = laneEndTimes.findIndex((end) => end <= block.startTime);
      if (lane === -1) {
        lane = laneEndTimes.length;
        laneEndTimes.push(0);
      }
      laneEndTimes[lane] = block.endTime;
      lanes.set(block.id, lane);
    }
    return lanes;
  }

  // each lane is exactly as tall as its tallest block
  get laneHeights(): number[] {
    let laneCount = 0;
    for (const lane of this.blockLanes.values())
      laneCount = Math.max(laneCount, lane + 1);

    const heights = Array(laneCount).fill(UNMEASURED_BLOCK_HEIGHT);
    for (const [blockId, lane] of this.blockLanes) {
      heights[lane] = Math.max(
        heights[lane],
        this.blockHeights.get(blockId) ?? UNMEASURED_BLOCK_HEIGHT,
      );
    }
    return heights;
  }

  // An empty chain takes up no vertical space at all, so a layer with no effect
  // chain lays out exactly as it would without the feature.
  get height() {
    return this.laneHeights.reduce((sum, laneHeight) => sum + laneHeight, 0);
  }

  // a chain's blocks are all the vertical space it has
  get blockLanesHeight() {
    return this.height;
  }

  blockTopOffset = (block: Block) => {
    const lane = this.blockLanes.get(block.id) ?? 0;
    // Blocks in the first lane are always at the top, so return before reading
    // laneHeights: touching it would subscribe them to every block's measured
    // height and re-render them whenever any block in the chain resizes.
    if (lane === 0) return 0;
    return this.laneHeights
      .slice(0, lane)
      .reduce((sum, laneHeight) => sum + laneHeight, 0);
  };

  // See LayerV2.reportBlockHeight for why a frame's worth of reports is batched
  // into a single observable write.
  reportBlockHeight = (block: Block, heightPx: number) => {
    if (
      this.blockHeights.get(block.id) === heightPx &&
      !this._pendingHeights.has(block.id)
    )
      return;

    this._pendingHeights.set(block.id, heightPx);
    if (this._heightFlushHandle !== null) return;
    if (typeof window === "undefined") {
      this.flushBlockHeights();
      return;
    }
    this._heightFlushHandle = window.requestAnimationFrame(() =>
      this.flushBlockHeights(),
    );
  };

  private flushBlockHeights = () => {
    this._heightFlushHandle = null;
    if (this._pendingHeights.size === 0) return;
    const pending = this._pendingHeights;
    this._pendingHeights = new Map();
    runInAction(() => {
      for (const [blockId, heightPx] of pending)
        this.blockHeights.set(blockId, heightPx);
    });
  };

  toggleVisible = () => {
    this.visible = !this.visible;
  };

  /**
   * Starts a new chain block at the playhead holding this effect.
   *
   * Effects live inside a chain block rather than alongside it, so this is how
   * a chain gains a block; further effects are stacked onto an existing one
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

  // kept in start time order, which is the only order a chain block has: its
  // effects carry the signal order, and blocks never overlap
  addBlock = (block: Block) => {
    block.layer = this;
    block.inEffectChain = true;
    const index = this.blocks.findIndex((b) => b.startTime > block.startTime);
    if (index === -1) this.blocks.push(block);
    else this.blocks.splice(index, 0, block);
  };

  removeBlock = (block: Block) => {
    const index = this.blocks.indexOf(block);
    if (index === -1) return;
    this.blocks.splice(index, 1);
    block.layer = null;
    block.inEffectChain = false;
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

  // The first gap at or after fromTime that no block occupies. Chain blocks
  // apply in series to the same composited input, so overlapping them would
  // leave their order to something the timeline cannot show.
  getNextValidStartAndDuration(fromTime: number, maxDuration: number) {
    let startTime = fromTime;
    for (const block of this.blocks) {
      if (block.endTime <= startTime) continue;
      if (block.startTime >= startTime + maxDuration) break;
      startTime = block.endTime;
    }
    const next = this.blocks.find((b) => b.startTime >= startTime);
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

    const desiredStartTime = relative ? block.startTime + desiredTime : desiredTime;
    const { previous, next } = this.neighborsOf(block);
    const lowerBound = previous?.endTime ?? 0;
    const upperBound = (next?.startTime ?? Infinity) - block.duration;
    if (upperBound < lowerBound) return;

    block.startTime = Math.min(Math.max(desiredStartTime, lowerBound), upperBound);
    // start time decides position in the chain's ordering
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

  // Chain blocks are applied in series rather than summed, so there is no
  // crossfade between them to derive.
  autoBlockOpacityAt = () => 1;
  autoOpacityVariations = (): Variation<number>[] | null => null;

  serialize = () => ({
    id: this.id,
    blocks: this.blocks.map((block) => block.serialize()),
  });

  static deserialize = (store: Store, name: string, data: any) => {
    const chain = new EffectChain(store, name);
    if (data?.id) chain.id = data.id;
    for (const blockData of data?.blocks ?? [])
      chain.addBlock(Block.deserialize(store, blockData));
    return chain;
  };
}
