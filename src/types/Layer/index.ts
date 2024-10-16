import { Block } from "@/src/types/Block";

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

export type Layer = {
  id: string;
  name: string;
  visible: boolean;
  height: number;
  store: RootStore;

  insertCloneOfBlock(block: Block): void;
  addBlock(block: Block): void;
  removeBlock(block: Block): void;
  attemptMoveBlock(block: Block, desiredTime: number, relative?: boolean): void;
  getAllBlocks(): Block[];

  getNextValidStartAndDuration(
    fromTime: number,
    maxDuration: number
  ): { startTime: number; duration: number };

  resizeBlockLeftBound(block: Block, delta: number): void;
  resizeBlockRightBound(block: Block, delta: number): void;
  recomputeHeight(): void;
  serialize(): object;
};
