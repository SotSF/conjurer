import type { Store } from "@/src/types/Store";
import { Block } from "@/src/types/Block";

export type ActivePatternsWindow = {
  startTime: number;
  endTime: number;
  patterns: string[];
};

export type Layer = {
  id: string;
  name: string;
  visible: boolean;
  // editor-only: when true the layer's timeline row shrinks to just its header
  // (its blocks are hidden from the timeline). Distinct from `visible`, which
  // controls whether the layer renders to the canopy. Not serialized.
  collapsed: boolean;
  height: number;
  store: Store;

  insertCloneOfBlock(block: Block): void;
  addBlock(block: Block): void;
  removeBlock(block: Block): void;
  attemptMoveBlock(block: Block, desiredTime: number, relative?: boolean): void;
  getAllBlocks(): Block[];

  getNextValidStartAndDuration(
    fromTime: number,
    maxDuration: number,
  ): { startTime: number; duration: number };

  resizeBlockLeftBound(block: Block, delta: number): void;
  resizeBlockRightBound(block: Block, delta: number): void;
  // blocks report their rendered height so the layer can size itself
  reportBlockHeight(block: Block, heightPx: number): void;
  // vertical pixel offset of the block within the layer's timeline row (blocks
  // overlapping in time are displayed stacked in lanes)
  blockTopOffset(block: Block): number;
  serialize(): object;
};
