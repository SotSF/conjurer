import type { Store } from "@/src/types/Store";
import { Block } from "./Block";
import { LayerV2 } from "./Layer/LayerV2";

export type ActivePatternsWindow = {
  startTime: number;
  endTime: number;
  patterns: string[];
};

export class BlockMap {
  map: Map<string, Block> = new Map();
  activePatternsIndex: ActivePatternsWindow[] = [];

  serialize = () => {
    const serialized: Record<string, any> = {};

    Object.entries(this.map).forEach(([id, block]) => {
      serialized[id] = block.serialize();
    });

    return serialized;
  };

  deserialize = (store: Store, layer: LayerV2, blockMap: any) => {
    Object.entries(blockMap).forEach(([id, blockData]: [string, any]) => {
      const block = Block.deserialize(store, blockData);
      block.layer = layer;
      layer.patternBlocks.map.set(id, block);
    });

    this.computeActivePatternsIndex();
  };

  addBlock = (block: Block) => {
    this.map.set(block.id, block);
    this.computeActivePatternsIndex();
  };

  removeBlock = (block: Block) => {
    this.map.delete(block.id);
    this.computeActivePatternsIndex();
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

  computeActivePatternsIndex = () => {
    const blocks = this.getAllBlocks();
    const patternStartTimes = blocks.map((b) => b.startTime);
    const patternEndTimes = blocks.map((b) => b.endTime);
    const allTimes = [...patternStartTimes, ...patternEndTimes].sort();
    const windows: ActivePatternsWindow[] = [];

    for (let i = 0; i < allTimes.length - 1; i++) {
      const startTime = allTimes[i];
      const endTime = allTimes[i + 1];
      const patterns = blocks
        .filter((b) => b.startTime <= startTime && b.endTime > startTime)
        .map((b) => b.id);

      windows.push({ startTime, endTime, patterns });
    }

    this.activePatternsIndex = windows;
  };
}
