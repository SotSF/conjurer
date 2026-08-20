import type { Store } from "@/src/types/Store";
import { Block } from "@/src/types/Block";
import { DEFAULT_BLOCK_DURATION } from "@/src/utils/time";
import { makeAutoObservable, runInAction } from "mobx";
import { generateId } from "@/src/utils/id";
import { Layer } from ".";
import { BlockMap } from "../BlockMap";
import { EffectTrack } from "@/src/types/EffectTrack";
import { Variation } from "@/src/types/Variations/Variation";
import { EasingVariation } from "@/src/types/Variations/EasingVariation";
import { CurveVariation } from "@/src/types/Variations/CurveVariation";
import { migrateSequenceToRegions } from "@/src/utils/migrateVariations";

// used for a block's lane until its actual rendered height is reported
const UNMEASURED_BLOCK_HEIGHT = 50;

// timeline row height when a layer is collapsed (just enough for its header)
export const COLLAPSED_LAYER_HEIGHT = 48;

export class LayerV2 implements Layer {
  readonly kind = "layer";
  id = generateId();
  name = "";
  visible = true;
  // editor-only view state; see Layer.collapsed. Not serialized.
  collapsed = false;

  // rendered block heights in px, reported from the DOM as blocks
  // mount/resize (see reportBlockHeight)
  blockHeights = new Map<string, number>();

  blockMap = new BlockMap();

  // effects applied to this layer's merged output, after all of its blocks have
  // been composited together
  effectTrack: EffectTrack;

  _lastComputedWindowStartTime: number = -1;
  _maxConcurrentBlocks: number | null = null;
  _activeBlocks: Block[] = [];

  // Buffered height reports, applied together once per frame. Deliberately not
  // observable — this is bookkeeping for the flush, not state anything renders.
  _pendingHeights = new Map<string, number>();
  _heightFlushHandle: number | null = null;

  constructor(readonly store: Store) {
    this.effectTrack = new EffectTrack(store, "Layer effects");
    makeAutoObservable(this, {
      store: false,
      _lastComputedWindowStartTime: false,
      _maxConcurrentBlocks: false,
      _activeBlocks: false,
      _pendingHeights: false,
      _heightFlushHandle: false,
    });
  }

  get activeBlocks(): Block[] {
    const currentWindow = this.blockMap.getActivePatternsWindow(
      this.store.audioStore.globalTime,
    );

    if (!currentWindow) {
      if (this._lastComputedWindowStartTime !== -1) {
        this._activeBlocks = [];
        this._lastComputedWindowStartTime = -1;
      }

      return this._activeBlocks;
    }

    if (this._lastComputedWindowStartTime === currentWindow.startTime) {
      return this._activeBlocks;
    }

    this._lastComputedWindowStartTime = currentWindow.startTime;
    const { patterns } = currentWindow;
    this._activeBlocks = patterns
      .map((patternId) => this.blockMap.map.get(patternId))
      .filter((b) => b !== undefined);

    return this._activeBlocks;
  }

  get maxConcurrentBlocks() {
    return this.blockMap.activePatternsIndex.reduce(
      (max, window) => Math.max(max, window.patterns.length),
      0,
    );
  }

  // Overlapping blocks are displayed stacked in "lanes" within the layer.
  // Greedy interval partitioning: in start time order, each block goes into
  // the first lane whose previous block has ended.
  get blockLanes(): Map<string, number> {
    const sorted = this.getAllBlocks().sort(
      (a, b) => a.startTime - b.startTime || a.id.localeCompare(b.id),
    );
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

  get laneCount() {
    let count = 1;
    for (const lane of this.blockLanes.values())
      count = Math.max(count, lane + 1);
    return count;
  }

  // each lane is exactly as tall as its tallest block
  get laneHeights(): number[] {
    const heights = Array(this.laneCount).fill(UNMEASURED_BLOCK_HEIGHT);
    for (const [blockId, lane] of this.blockLanes) {
      heights[lane] = Math.max(
        heights[lane],
        this.blockHeights.get(blockId) ?? UNMEASURED_BLOCK_HEIGHT,
      );
    }
    return heights;
  }

  // Height of the block lanes alone. The effect track strip sits directly below
  // them, so this is where it starts.
  get blockLanesHeight() {
    return this.laneHeights.reduce((sum, laneHeight) => sum + laneHeight, 0);
  }

  get height() {
    if (this.collapsed) return COLLAPSED_LAYER_HEIGHT;
    return this.blockLanesHeight + this.effectTrack.height;
  }

  blockTopOffset = (block: Block) => {
    const lane = this.blockLanes.get(block.id) ?? 0;
    // Blocks in the first lane are always at the top, so return before reading
    // laneHeights: touching it would subscribe them to every block's measured
    // height and re-render them whenever any block in the layer resizes.
    if (lane === 0) return 0;
    return this.laneHeights
      .slice(0, lane)
      .reduce((sum, laneHeight) => sum + laneHeight, 0);
  };

  // Fade windows derived from staggered block overlaps: a block fades in
  // while an earlier-starting block is still playing, and fades out once a
  // later-starting block that outlasts it has begun. Blocks entirely
  // containing/contained by another get no auto fade (there is no obvious
  // intent), rendering both at full opacity.
  get autoFadeWindows(): Map<
    string,
    { fadeInEnd: number | null; fadeOutStart: number | null }
  > {
    const blocks = this.getAllBlocks();
    const windows = new Map();
    for (const block of blocks) {
      let fadeInEnd: number | null = null;
      let fadeOutStart: number | null = null;
      for (const other of blocks) {
        if (other === block) continue;
        if (
          other.startTime < block.startTime &&
          other.endTime > block.startTime &&
          other.endTime <= block.endTime
        )
          fadeInEnd = Math.max(fadeInEnd ?? -Infinity, other.endTime);
        if (
          other.startTime > block.startTime &&
          other.startTime < block.endTime &&
          other.endTime >= block.endTime
        )
          fadeOutStart = Math.min(fadeOutStart ?? Infinity, other.startTime);
      }
      if (fadeInEnd !== null || fadeOutStart !== null)
        windows.set(block.id, { fadeInEnd, fadeOutStart });
    }
    return windows;
  }

  // The auto fades expressed as ordinary variations: equal-power crossfade
  // curves (easeOutSine 0->1 in, easeInSine 1->0 out) so summed brightness
  // stays constant through the overlap. Serving as the single source of truth
  // for rendering, display, and materialization into manual mode.
  get autoOpacityVariationsByBlock(): Map<string, Variation<number>[]> {
    const variationsByBlock = new Map<string, Variation<number>[]>();
    for (const [blockId, window] of this.autoFadeWindows) {
      const block = this.blockMap.map.get(blockId);
      if (!block) continue;

      const fadeInEnd = window.fadeInEnd ?? block.startTime;
      const fadeOutStart = window.fadeOutStart ?? block.endTime;
      // crossing fade windows (a block overlapped on both sides at once) have
      // no clean sequential expression; fall back to full opacity
      if (fadeInEnd > fadeOutStart) continue;

      const variations: Variation<number>[] = [];
      if (fadeInEnd > block.startTime)
        variations.push(
          new EasingVariation(fadeInEnd - block.startTime, "easeOutSine", 0, 1),
        );
      if (fadeOutStart > fadeInEnd)
        variations.push(
          CurveVariation.flat(fadeOutStart - fadeInEnd, 1),
        );
      if (block.endTime > fadeOutStart)
        variations.push(
          new EasingVariation(block.endTime - fadeOutStart, "easeInSine", 1, 0),
        );
      variationsByBlock.set(blockId, variations);
    }
    return variationsByBlock;
  }

  autoOpacityVariations = (block: Block): Variation<number>[] | null =>
    this.autoOpacityVariationsByBlock.get(block.id) ?? null;

  autoBlockOpacityAt = (block: Block, globalTime: number) => {
    const variations = this.autoOpacityVariations(block);
    if (!variations) return 1;

    let time = globalTime - block.startTime;
    for (const variation of variations) {
      if (time < variation.duration)
        return variation.valueAtTime(time, globalTime);
      time -= variation.duration;
    }
    return 1;
  };

  /**
   * Record a block's rendered height, batching a frame's worth of reports into
   * a single observable write.
   *
   * Every block reads blockTopOffset, which reads laneHeights, which reads the
   * whole blockHeights map — so writing one entry re-renders every mounted
   * block in the layer. One write per report is therefore quadratic in the
   * number of blocks changing size at once, which is exactly what happens when
   * a zoom or a lane toggle resizes many blocks in the same frame. Measured on
   * a scroll that resized 84 blocks: 12,262 TimelineBlockStack renders before
   * batching, 934 after.
   */
  reportBlockHeight = (block: Block, heightPx: number) => {
    // Ignore reports that wouldn't change anything. Without this the flush is
    // self-sustaining: applying a batch re-renders the layer's blocks, which
    // fires their ResizeObservers, which re-report the identical heights and
    // schedule another flush — burning a full layer re-render every frame
    // forever. (Measured: idle frame time doubled, 8.4ms -> 16.7ms.)
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

  insertCloneOfBlock = (block: Block) => {
    const newBlock = block.clone();
    newBlock.setTiming({
      startTime: this.store.audioStore.globalTime,
      duration: DEFAULT_BLOCK_DURATION,
    });
    // Playground params may be short constant regions; fold legacy flats into
    // editable Curves and span every numeric lane to the inserted block length.
    const convert = (b: Block, laneDuration: number) => {
      for (const uniformName of Object.keys(b.parameterVariations ?? {})) {
        const param = b.pattern.params[uniformName];
        if (!param || typeof param.value !== "number") continue;
        b.parameterVariations[uniformName] = migrateSequenceToRegions(
          b.parameterVariations[uniformName],
          laneDuration,
          param.value,
        );
      }
      b.effectBlocks.forEach((effect) => convert(effect, laneDuration));
    };
    convert(newBlock, newBlock.duration);
    this.addBlock(newBlock);
  };

  addBlock = (block: Block) => {
    block.layer = this;
    this.blockMap.addBlock(block);
  };

  removeBlock = (block: Block) => {
    if (block.isEffectTrackBlock) {
      this.effectTrack.removeBlock(block);
      return;
    }
    this.blockMap.removeBlock(block);
    block.layer = null;
  };

  getAllBlocks() {
    return this.blockMap.getAllBlocks();
  }

  getNextValidStartAndDuration(fromTime: number, maxDuration: number) {
    return { startTime: fromTime, duration: maxDuration };
  }

  /**
   * Changes a blocks starting time, and reorders it in the list of blocks
   *
   * @param {Block} block
   * @param {number} newStartTime
   * @memberof Store
   */
  changeBlockStartTime = (block: Block, newStartTime: number) => {
    block.startTime = newStartTime;
  };

  attemptMoveBlock = (block: Block, desiredTime: number, relative = false) => {
    if (block.layer != this || block.locked) return;
    block.startTime = relative ? desiredTime + block.startTime : desiredTime;
  };

  resizeBlockLeftBound = (block: Block, delta: number) => {
    if (block.layer != this || block.locked) return;

    const desiredStartTime = block.startTime + delta;

    // do not allow changing start of this block past end of self
    if (desiredStartTime >= block.endTime) return;

    // do not allow changing start of block past start of timeline
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

    // do not allow changing end of block past start of self
    if (desiredEndTime <= block.startTime) return;

    block.duration += delta;
  };

  serialize = () => ({
    id: this.id,
    name: this.name,
    blockMap: this.blockMap.serialize(),
    // stored under the key existing saved experiences use
    effectChain: this.effectTrack.serialize(),
  });

  static deserialize = (store: Store, data: any) => {
    const layer = new LayerV2(store);
    if (data.id) layer.id = data.id;
    layer.name = data.name ?? "";

    layer.blockMap = BlockMap.deserialize(store, layer, data.blockMap);
    layer.effectTrack = EffectTrack.deserialize(
      store,
      "Layer effects",
      data.effectChain,
    );
    return layer;
  };
}
