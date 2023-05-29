import { Block } from "@/src/types/Block";
import { Timer } from "@/src/types/Timer";
import { binarySearchForBlockAtTime } from "@/src/utils/algorithm";
import { DEFAULT_BLOCK_DURATION } from "@/src/utils/time";
import { makeAutoObservable } from "mobx";
import { Pattern } from "@/src/types/Pattern";

export class Layer {
  id: string = Math.random().toString(16).slice(2); // unique id
  patternBlocks: Block[] = [];
  visible = true;
  height = 350;

  _lastComputedCurrentBlock: Block | null = null;

  // returns the block that the global time is inside of, or null if none
  // runs every frame, so we keep this performant with caching + a binary search
  get currentBlock(): Block | null {
    if (
      this._lastComputedCurrentBlock &&
      this._lastComputedCurrentBlock.startTime <= this.timer.globalTime &&
      this.timer.globalTime < this._lastComputedCurrentBlock.endTime
    ) {
      return this._lastComputedCurrentBlock;
    }

    const currentBlockIndex = binarySearchForBlockAtTime(
      this.patternBlocks,
      this.timer.globalTime
    );
    this._lastComputedCurrentBlock =
      this.patternBlocks[currentBlockIndex] ?? null;
    return this._lastComputedCurrentBlock;
  }

  get endTime() {
    if (this.patternBlocks.length === 0) return 0;

    const lastBlock = this.patternBlocks[this.patternBlocks.length - 1];
    return lastBlock.endTime;
  }

  constructor(readonly timer: Timer) {
    makeAutoObservable(this, {
      _lastComputedCurrentBlock: false, // don't make this observable, since it's just a cache
    });
  }

  insertCloneOfPattern = (pattern: Pattern) => {
    const newBlock = new Block(pattern.clone());
    const nextGap = this.nextFiniteGap(this.timer.globalTime);
    newBlock.setTiming(nextGap);
    this.addBlock(newBlock);
  };

  addBlock = (block: Block) => {
    // insert block in sorted order
    const index = this.patternBlocks.findIndex(
      (b) => b.startTime > block.startTime
    );
    if (index === -1) {
      this.patternBlocks.push(block);
      return;
    }

    this.patternBlocks.splice(index, 0, block);
    block.layer = this;
  };

  removeBlock = (block: Block) => {
    this.patternBlocks = this.patternBlocks.filter((b) => b !== block);
    block.layer = null;
    this._lastComputedCurrentBlock = null;
  };

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

  /**
   * Returns the next gap in the timeline, starting from the given time.
   * A missing duration means that the gap is infinite.
   *
   * @param {number} fromTime
   * @memberof Store
   */
  nextGap = (
    fromTime: number,
    blocks: Block[] = this.patternBlocks
  ): { startTime: number; duration?: number } => {
    // no blocks
    if (blocks.length === 0) return { startTime: fromTime };

    // fromTime is before first block
    const firstBlock = blocks[0];
    if (fromTime < firstBlock.startTime) {
      return {
        startTime: fromTime,
        duration: firstBlock.startTime - fromTime,
      };
    }

    // fromTime is after last block
    const lastBlock = blocks[blocks.length - 1];
    if (fromTime >= lastBlock.endTime) {
      return { startTime: fromTime, duration: Infinity };
    }

    // fromTime is in between start of first block and end of last block
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const nextBlock = blocks[i + 1];

      // fromTime is in this block
      if (block.startTime <= fromTime && fromTime < block.endTime) {
        if (!nextBlock) return { startTime: block.endTime };

        // check if next block is far enough away for a gap
        if (nextBlock.startTime - block.endTime > 0.1) {
          return {
            startTime: block.endTime,
            duration: nextBlock.startTime - block.endTime,
          };
        }
        continue;
      }

      // fromTime is after this block and before next block
      if (
        nextBlock &&
        fromTime >= block.endTime &&
        fromTime < nextBlock.startTime &&
        nextBlock.startTime - fromTime > 0.1
      ) {
        return {
          startTime: fromTime,
          duration: nextBlock.startTime - fromTime,
        };
      }
    }

    return { startTime: lastBlock.endTime };
  };

  /**
   * Returns the next gap in the timeline, starting from the given time.
   * The gap will always be of a finite duration, and no more than the given maxDuration.
   * @param {number} fromTime
   * @param {number} [maxDuration=DEFAULT_BLOCK_DURATION]
   * @memberof Store
   */
  nextFiniteGap = (
    fromTime: number,
    maxDuration: number = DEFAULT_BLOCK_DURATION,
    blocks: Block[] = this.patternBlocks
  ): { startTime: number; duration: number } => {
    const gap = this.nextGap(fromTime, blocks);
    return {
      startTime: gap.startTime,
      duration: gap.duration
        ? Math.min(gap.duration, maxDuration)
        : maxDuration,
    };
  };

  nearestValidStartTimeDelta = (block: Block, desiredDeltaTime: number) => {
    const desiredStartTime = block.startTime + desiredDeltaTime;
    const desiredEndTime = block.endTime + desiredDeltaTime;

    let leftOverlappingBlock = null;
    let rightOverlappingBlock = null;
    for (const otherBlock of this.patternBlocks) {
      if (otherBlock === block) continue;

      // check if desired start time span overlaps with other block
      if (
        desiredStartTime >= otherBlock.startTime &&
        desiredStartTime < otherBlock.endTime
      )
        leftOverlappingBlock = otherBlock;

      // check if desired end time span overlaps with other block
      if (
        desiredEndTime > otherBlock.startTime &&
        desiredEndTime <= otherBlock.endTime
      )
        rightOverlappingBlock = otherBlock;
    }

    // if there is no overlap, return the desired delta time
    if (!leftOverlappingBlock && !rightOverlappingBlock) {
      // make sure that there is not a block entirely inside of the desired time span
      const { startTime, duration } = this.nextFiniteGap(
        desiredStartTime,
        block.duration,
        this.patternBlocks.filter((b) => b !== block)
      );
      return startTime === desiredStartTime && duration >= block.duration
        ? desiredDeltaTime
        : 0;
    }

    // if there is overlap on both sides, return 0
    if (leftOverlappingBlock && rightOverlappingBlock) return 0;

    let potentialStartTime = 0;
    if (leftOverlappingBlock) potentialStartTime = leftOverlappingBlock.endTime;
    if (rightOverlappingBlock)
      potentialStartTime = rightOverlappingBlock.startTime - block.duration;

    const { startTime, duration } = this.nextFiniteGap(
      potentialStartTime,
      block.duration,
      this.patternBlocks.filter((b) => b !== block)
    );
    return potentialStartTime === startTime && duration >= block.duration
      ? potentialStartTime - block.startTime
      : 0;
  };

  resizeBlockLeftBound = (block: Block, delta: number) => {
    const desiredStartTime = block.startTime + delta;

    // do not allow changing start of this block past end of self
    if (desiredStartTime >= block.endTime) return;

    // do not allow changing start of this block before end of prior block
    const previousBlock =
      this.patternBlocks[this.patternBlocks.indexOf(block) - 1];
    if (previousBlock && desiredStartTime < previousBlock.endTime) {
      block.duration = block.endTime - previousBlock.endTime;
      block.startTime = previousBlock.endTime;
      return;
    }

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

    // do not allow changing end of block past start of next block
    const nextBlock = this.patternBlocks[this.patternBlocks.indexOf(block) + 1];
    if (nextBlock && desiredEndTime > nextBlock.startTime) {
      block.duration = nextBlock.startTime - block.startTime;
      return;
    }

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
    patternBlocks: this.patternBlocks.map((b) => b.serialize()),
  });

  static deserialize = (data: any, timer: Timer) => {
    const layer = new Layer(timer);
    layer.patternBlocks = data.patternBlocks.map((b: any) =>
      Block.deserialize(b)
    );
    layer.patternBlocks.forEach((b) => (b.layer = layer));
    return layer;
  };
}
