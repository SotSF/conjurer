import { makeAutoObservable, runInAction } from "mobx";
import type { Store } from "@/src/types/Store";
import type { Layer } from "@/src/types/Layer";
import { Block } from "@/src/types/Block";
import type { Pattern } from "@/src/types/Pattern";
import type { Variation } from "@/src/types/Variations/Variation";
import { generateId } from "@/src/utils/id";
import { DEFAULT_BLOCK_DURATION } from "@/src/utils/time";
import { defaultEffectMap } from "@/src/effects/effects";

// used for a block's lane until its actual rendered height is reported
const UNMEASURED_BLOCK_HEIGHT = 50;

/**
 * An ordered chain of effect blocks applied to already-composited output —
 * either one layer's merged blocks or the entire layer stack. Position in
 * `blocks` is signal order; each block's start time and duration decide when it
 * is in the signal path at all.
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
          (block) => block.startTime <= globalTime && globalTime < block.endTime,
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

  // Append an effect to the end of the chain, playing from the playhead.
  addCloneOfEffect = (effect: Pattern) => {
    const block = new Block(this.store, effect.clone());
    block.setTiming({
      startTime: this.store.audioStore.globalTime,
      duration: DEFAULT_BLOCK_DURATION,
    });
    this.addBlock(block);
    return block;
  };

  addBlock = (block: Block) => {
    block.layer = this;
    block.inEffectChain = true;
    this.blocks.push(block);
  };

  removeBlock = (block: Block) => {
    const index = this.blocks.indexOf(block);
    if (index === -1) return;
    this.blocks.splice(index, 1);
    block.layer = null;
    block.inEffectChain = false;
  };

  // Move a block `delta` positions along the chain, changing the order its
  // effect is applied in.
  reorderBlock = (block: Block, delta: number) => {
    const index = this.blocks.indexOf(block);
    if (index < 0) return;

    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= this.blocks.length) return;

    this.blocks.splice(index, 1);
    this.blocks.splice(newIndex, 0, block);
  };

  // Only effects belong in a chain, so a pattern block dropped here is ignored.
  insertCloneOfBlock = (block: Block) => {
    if (!defaultEffectMap[block.pattern.name]) return;
    const clone = block.clone();
    clone.regenerateId();
    clone.setTiming({
      startTime: this.store.audioStore.globalTime,
      duration: block.duration,
    });
    this.addBlock(clone);
  };

  getAllBlocks() {
    return this.blocks.slice();
  }

  getNextValidStartAndDuration(fromTime: number, maxDuration: number) {
    return { startTime: fromTime, duration: maxDuration };
  }

  attemptMoveBlock = (block: Block, desiredTime: number, relative = false) => {
    if (block.layer != this || block.locked) return;
    block.startTime = relative ? desiredTime + block.startTime : desiredTime;
  };

  resizeBlockLeftBound = (block: Block, delta: number) => {
    if (block.layer != this || block.locked) return;

    const desiredStartTime = block.startTime + delta;
    if (desiredStartTime >= block.endTime) return;

    if (desiredStartTime < 0) {
      block.duration = block.endTime;
      block.startTime = 0;
      return;
    }

    block.startTime += delta;
    block.duration -= delta;
  };

  resizeBlockRightBound = (block: Block, delta: number) => {
    if (block.layer != this || block.locked) return;

    const desiredEndTime = block.endTime + delta;
    if (desiredEndTime <= block.startTime) return;

    block.duration += delta;
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
