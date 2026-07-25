import type { Store } from "@/src/types/Store";
import { Block } from "./Block";
import type { Layer } from "./Layer";
import { makeAutoObservable } from "mobx";

export type ActivePatternsWindow = {
  startTime: number;
  endTime: number;
  patterns: string[];
};

export class BlockMap {
  map: Map<string, Block> = new Map();

  constructor() {
    makeAutoObservable(this);
  }

  serialize = () => {
    const serialized: Record<string, any> = {};

    for (let [id, block] of this.map.entries()) {
      serialized[id] = block.serialize();
    }

    return serialized;
  };

  static deserialize = (store: Store, layer: Layer, data: any) => {
    const blockMap = new BlockMap();
    Object.entries(data ?? {}).forEach(([id, blockData]: [string, any]) => {
      const block = Block.deserialize(store, blockData);
      block.layer = layer;
      blockMap.map.set(id, block);
    });

    return blockMap;
  };

  addBlock = (block: Block) => {
    this.map.set(block.id, block);
  };

  removeBlock = (block: Block) => {
    this.map.delete(block.id);
  };

  getActivePatternsWindow(
    time: number,
    start = 0,
    end = this.activePatternsIndex.length - 1,
  ): ActivePatternsWindow | undefined {
    if (start > end) return;
    const mid = Math.floor((start + end) / 2);
    const window = this.activePatternsIndex[mid];
    if (window.startTime <= time && time < window.endTime) return window;
    if (time < window.startTime)
      return this.getActivePatternsWindow(time, start, mid - 1);
    return this.getActivePatternsWindow(time, mid + 1, end);
  }

  getAllBlocks = () => [...this.map.values()];

  // a computed rather than a manually-invalidated cache so that any mutation
  // of block timing (moves, resizes, timing modal edits) is reflected
  get activePatternsIndex(): ActivePatternsWindow[] {
    const blocks = this.getAllBlocks();
    const patternStartTimes = blocks.map((b) => b.startTime);
    const patternEndTimes = blocks.map((b) => b.endTime);
    const allTimes = new Set([...patternStartTimes, ...patternEndTimes]);
    const sortedTimes = new Float64Array([...allTimes]).toSorted();
    const windows: ActivePatternsWindow[] = [];

    for (let i = 0; i < sortedTimes.length - 1; i++) {
      const startTime = sortedTimes[i];
      const endTime = sortedTimes[i + 1];
      const patterns = blocks
        .filter((b) => b.startTime <= startTime && b.endTime > startTime)
        .map((b) => b.id);

      windows.push({ startTime, endTime, patterns });
    }

    return windows;
  }
}
