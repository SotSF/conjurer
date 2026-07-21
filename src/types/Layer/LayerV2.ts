import type { Store } from "@/src/types/Store";
import { Block } from "@/src/types/Block";
import { DEFAULT_BLOCK_DURATION } from "@/src/utils/time";
import { makeAutoObservable } from "mobx";
import { generateId } from "@/src/utils/id";
import { Layer } from ".";
import { BlockMap } from "../BlockMap";

// used for a block's lane until its actual rendered height is reported
const UNMEASURED_BLOCK_HEIGHT = 50;

export class LayerV2 implements Layer {
  id = generateId();
  name = "";
  visible = true;

  // rendered block heights in px, reported from the DOM as blocks
  // mount/resize (see reportBlockHeight)
  blockHeights = new Map<string, number>();

  blockMap = new BlockMap();

  _lastComputedWindowStartTime: number = -1;
  _maxConcurrentBlocks: number | null = null;
  _activeBlocks: Block[] = [];

  constructor(readonly store: Store) {
    makeAutoObservable(this, {
      store: false,
      _lastComputedWindowStartTime: false,
      _maxConcurrentBlocks: false,
      _activeBlocks: false,
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

  get height() {
    return this.laneHeights.reduce((sum, laneHeight) => sum + laneHeight, 0);
  }

  blockTopOffset = (block: Block) => {
    const lane = this.blockLanes.get(block.id) ?? 0;
    return this.laneHeights
      .slice(0, lane)
      .reduce((sum, laneHeight) => sum + laneHeight, 0);
  };

  reportBlockHeight = (block: Block, heightPx: number) => {
    this.blockHeights.set(block.id, heightPx);
  };

  insertCloneOfBlock = (block: Block) => {
    const newBlock = block.clone();
    newBlock.setTiming({
      startTime: this.store.audioStore.globalTime,
      duration: DEFAULT_BLOCK_DURATION,
    });
    this.addBlock(newBlock);
  };

  addBlock = (block: Block) => {
    block.layer = this;
    this.blockMap.addBlock(block);
  };

  removeBlock = (block: Block) => {
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
    if (block.layer != this) return;
    block.startTime = relative ? desiredTime + block.startTime : desiredTime;
  };

  resizeBlockLeftBound = (block: Block, delta: number) => {
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
    const desiredEndTime = block.endTime + delta;

    // do not allow changing end of block past start of self
    if (desiredEndTime <= block.startTime) return;

    block.duration += delta;
  };

  serialize = () => ({
    id: this.id,
    name: this.name,
    blockMap: this.blockMap.serialize(),
  });

  static deserialize = (store: Store, data: any) => {
    const layer = new LayerV2(store);
    if (data.id) layer.id = data.id;
    layer.name = data.name ?? "";

    layer.blockMap = BlockMap.deserialize(store, layer, data.blockMap);
    return layer;
  };
}
