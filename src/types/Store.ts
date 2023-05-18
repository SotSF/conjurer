import { Block } from "@/src/types/Block";
import { Pattern } from "@/src/types/Pattern";
import { Timer } from "@/src/types/Timer";
import { UIStore } from "@/src/types/UIStore";
import { binarySearchForBlockAtTime } from "@/src/utils/algorithm";
import { DEFAULT_BLOCK_DURATION } from "@/src/utils/time";
import { patterns } from "@/src/patterns/patterns";
import { makeAutoObservable, configure } from "mobx";
import { AudioStore } from "@/src/types/AudioStore";
import { Variation } from "@/src/types/Variations/Variation";
import { ExperienceStore } from "@/src/types/ExperienceStore";

// Enforce MobX strict mode, which can make many noisy console warnings, but can help use learn MobX better.
// Feel free to comment out the following if you want to silence the console messages.
configure({
  enforceActions: "always",
  computedRequiresReaction: true,
  reactionRequiresObservable: true,
  observableRequiresReaction: false, // This will trigger false positives sometimes, so turning off
});

export class Store {
  initialized = false;
  timer = new Timer();
  uiStore = new UIStore();
  audioStore = new AudioStore(this.timer);
  experienceStore = new ExperienceStore(this);

  patternBlocks: Block[] = [];
  selectedBlocks: Set<Block> = new Set();

  selectedVariationBlock: Block | null = null;
  selectedVariationUniformName: string = "";
  selectedVariation: Variation | null = null;

  patterns: Pattern[] = patterns;
  selectedPattern: Pattern = patterns[0];
  draggingPattern: boolean = false;

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

  _user = "";

  get user(): string {
    return this._user;
  }

  set user(value: string) {
    this._user = value;
    localStorage.setItem("user", value);
  }

  _experienceName = "";

  get experienceName(): string {
    return this._experienceName;
  }

  set experienceName(value: string) {
    this._experienceName = value;
    localStorage.setItem("experienceName", value);
  }

  constructor() {
    makeAutoObservable(this, {
      _lastComputedCurrentBlock: false, // don't make this observable, since it's just a cache
    });
  }

  initialize = () => {
    this.experienceStore.loadInitialExperience();

    // check for a username in local storage
    const username = localStorage.getItem("user");
    if (username) this._user = username;

    // set up an autosave interval
    setInterval(() => {
      if (!this.timer.playing)
        this.experienceStore.saveToLocalStorage("autosave");
    }, 60 * 1000);

    this.initialized = true;
  };

  insertCloneOfPattern = (pattern: Pattern) => {
    const newBlock = new Block(pattern.clone());
    const nextGap = this.nextFiniteGap(this.timer.globalTime);
    newBlock.setTiming(nextGap);
    this.addBlock(newBlock);
  };

  /**
   * Inserts a clone of the given effect into the selected blocks
   *
   * @param {Pattern} effect
   * @memberof Store
   */
  insertCloneOfEffect = (effect: Pattern) => {
    if (this.selectedBlocks.size === 0) return;

    for (const block of Array.from(this.selectedBlocks)) {
      block.addCloneOfEffect(effect);
    }
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
  };

  removeBlock = (block: Block) => {
    this.patternBlocks = this.patternBlocks.filter((b) => b !== block);
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

  selectBlock = (block: Block) => {
    this.selectedBlocks = new Set([block]);
  };

  addBlockToSelection = (block: Block) => {
    this.selectedBlocks.add(block);
  };

  deselectBlock = (block: Block) => {
    this.selectedBlocks.delete(block);
  };

  selectAllBlocks = () => {
    this.selectedBlocks = new Set(this.patternBlocks);
  };

  deselectAllBlocks = () => {
    if (this.selectedBlocks.size === 0) return;
    this.selectedBlocks = new Set();
  };

  deleteSelected = () => {
    if (this.selectedBlocks.size > 0) {
      Array.from(this.selectedBlocks).forEach(this.removeBlock);
      this.selectedBlocks = new Set();
      return;
    }

    if (this.selectedVariation) {
      this.selectedVariationBlock?.removeVariation(
        this.selectedVariationUniformName,
        this.selectedVariation
      );
    }
  };

  copyBlocksToClipboard = (clipboardData: DataTransfer) => {
    clipboardData.setData(
      "text/plain",
      JSON.stringify(Array.from(this.selectedBlocks).map((b) => b.serialize()))
    );
  };

  pasteBlocksFromClipboard = (clipboardData: DataTransfer) => {
    const blocksData = JSON.parse(clipboardData.getData("text/plain"));
    if (!blocksData || !blocksData.length) return;

    const blocksToPaste = blocksData.map((b: any) => Block.deserialize(b));
    this.selectedBlocks = new Set();
    for (const blockToPaste of blocksToPaste) {
      const nextGap = this.nextFiniteGap(
        this.timer.globalTime,
        blockToPaste.duration
      );
      blockToPaste.setTiming(nextGap);
      this.addBlock(blockToPaste);
      this.addBlockToSelection(blockToPaste);
    }
  };

  duplicateSelected = () => {
    if (this.selectedBlocks.size > 0) {
      const selectedBlocks = Array.from(this.selectedBlocks);
      this.selectedBlocks = new Set();
      for (const selectedBlock of selectedBlocks) {
        const newBlock = selectedBlock.clone();
        const nextGap = this.nextFiniteGap(
          selectedBlock.endTime,
          selectedBlock.duration
        );
        newBlock.setTiming(nextGap);
        this.addBlock(newBlock);
        this.addBlockToSelection(newBlock);
      }
      return;
    }

    if (this.selectedVariation) {
      this.selectedVariationBlock?.duplicateVariation(
        this.selectedVariationUniformName,
        this.selectedVariation
      );
    }
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
    if (fromTime >= this.endTime) {
      return { startTime: fromTime };
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

    const lastBlock = blocks[blocks.length - 1];
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

  selectVariation = (
    block: Block,
    uniformName: string,
    variation: Variation
  ) => {
    if (this.selectedVariation?.id === variation.id) {
      this.selectedVariation = null;
      this.selectedVariationUniformName = "";
      this.selectedVariationBlock = null;
      return;
    }

    this.selectedVariation = variation;
    this.selectedVariationUniformName = uniformName;
    this.selectedVariationBlock = block;
  };

  serialize = () => ({
    audioStore: this.audioStore.serialize(),
    blocks: this.patternBlocks.map((b) => b.serialize()),
    uiStore: this.uiStore.serialize(),
    user: this.user,
  });

  deserialize = (data: any) => {
    this.audioStore.deserialize(data.audioStore);
    this.uiStore.deserialize(data.uiStore);
    this.patternBlocks = data.blocks.map((b: any) => Block.deserialize(b));
    this._lastComputedCurrentBlock = null;
  };
}
