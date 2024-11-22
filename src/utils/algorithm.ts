import type { Block } from "@/src/types/Block";

// binary search over an ordered list of blocks
export function binarySearchForBlockAtTime(
  blocks: Block[],
  time: number,
  start = 0,
  end = blocks.length - 1,
): number {
  if (start > end) return -1;
  const mid = Math.floor((start + end) / 2);
  const block = blocks[mid];
  if (block.startTime <= time && time < block.endTime) return mid;
  if (time < block.startTime)
    return binarySearchForBlockAtTime(blocks, time, start, mid - 1);
  return binarySearchForBlockAtTime(blocks, time, mid + 1, end);
}
