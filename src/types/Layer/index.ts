import { Block } from "@/src/types/Block";
import { binarySearchForBlockAtTime } from "@/src/utils/algorithm";
import { DEFAULT_BLOCK_DURATION } from "@/src/utils/time";
import { makeAutoObservable } from "mobx";
import { generateId } from "@/src/utils/id";

type RootStore = {
  context: string;
  audioStore: {
    getPeakAtTime: (time: number) => number;
    globalTime: number;
  };
};

export type ActivePatternsWindow = {
  startTime: number;
  endTime: number;
  patterns: string[];
};

export abstract class Layer {
  id: string = generateId();
  name = "";
  visible = true;
  height = 350;

  constructor(readonly store: RootStore, overrides?: object) {
    this.store = store;
    // makeAutoObservable(this, { store: false, ...overrides });
  }

  /**
   * Inserts a clone of the given block into the layer at the next valid time. For the V1
   * data model this is the next gap in the timeline. For the V2 data model this is the
   * current time.
   */
  abstract insertCloneOfBlock: (block: Block) => void;

  abstract addBlock: (block: Block) => void;
  abstract removeBlock: (block: Block) => void;

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

  abstract attemptMoveBlock: (
    block: Block,
    desiredTime: number,
    relative?: boolean
  ) => void;

  abstract getAllBlocks(): Block[];

  abstract getNextValidStartAndDuration(
    fromTime: number,
    maxDuration: number
  ): { startTime: number; duration: number };

  abstract resizeBlockLeftBound: (block: Block, delta: number) => void;
  abstract resizeBlockRightBound: (block: Block, delta: number) => void;

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

  abstract serialize(): object;
}
