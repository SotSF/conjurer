import { Block, RootStore } from "@/src/types/Block";
import { DEFAULT_BLOCK_DURATION } from "@/src/utils/time";
import { makeAutoObservable } from "mobx";
import { generateId } from "@/src/utils/id";
import { Layer } from ".";
import { BlockMap } from "../BlockMap";

export class LayerV2 extends Layer {
  id: string = generateId();
  name = "";

  patternBlocks = new BlockMap();
  visible = true;

  height = 350;

  _lastComputedCurrentBlock: Block | null = null;
  _maxConcurrentBlocks: number | null = null;

  get activeBlocks(): Block[] {
    const currentWindow = this.patternBlocks.getActivePatternsWindow(
      this.store.audioStore.globalTime
    );

    if (!currentWindow) return [];
    const { patterns } = currentWindow;
    return patterns
      .map((patternId) => this.patternBlocks.map.get(patternId))
      .filter((b) => b !== undefined);
  }

  get maxConcurrentBlocks() {
    if (this._maxConcurrentBlocks === null) {
      this._maxConcurrentBlocks = this.patternBlocks.activePatternsIndex.reduce(
        (max, window) => Math.max(max, window.patterns.length),
        0
      );
    }

    return this._maxConcurrentBlocks;
  }

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
    this.patternBlocks.addBlock(block);
  };

  removeBlock = (block: Block) => {
    this.patternBlocks.removeBlock(block);
    block.layer = null;
  };

  getAllBlocks() {
    return this.patternBlocks.getAllBlocks();
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
    this.reorderBlock(block);
  };

  reorderBlock = (block: Block) => {
    this.removeBlock(block);
    this.addBlock(block);
  };

  attemptMoveBlock = (block: Block, desiredTime: number, relative = false) => {
    if (block.layer != this) return;
    this.changeBlockStartTime(block, block.startTime);
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

  recomputeHeight = () => {
    const element = document.getElementById("timeline-layer-" + this.id);
    const blockstackElements = element?.children;

    if (!blockstackElements || blockstackElements.length === 0) return;

    let maxHeight = 0;
    for (const blockstackElement of blockstackElements) {
      const blockElement = blockstackElement.children[0];
      const blockHeight = blockElement.clientHeight;
      maxHeight = Math.max(maxHeight, blockHeight);
    }
    this.height = maxHeight + 6; // to account for border
  };

  serialize = () => ({
    id: this.id,
    name: this.name,
    patternBlocks: this.patternBlocks.serialize(),
  });

  static deserialize = (store: RootStore, data: any) => {
    const layer = new LayerV2(store);
    if (data.id) layer.id = data.id;
    layer.name = data.name ?? "";

    layer.patternBlocks.deserialize(store, layer, data.patternBlocks);
    return layer;
  };
}
