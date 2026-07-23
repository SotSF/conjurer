import { Block } from "@/src/types/Block";
import { ParamType } from "@/src/params/shared/patternParam";

// The value a param takes at the given global time. When the time falls outside
// the block, it is clamped to the block's start/end (so the readout shows the
// value at whichever edge the playhead is nearest). Falls back to the param's
// current/default value when no variations are authored.
export const paramValueAtTime = (
  block: Block,
  uniformName: string,
  globalTime: number,
): ParamType => {
  const clamped = Math.max(
    block.startTime,
    Math.min(globalTime, block.endTime),
  );
  const localTime = clamped - block.startTime;

  const variations = block.parameterVariations[uniformName];
  if (!variations || variations.length === 0)
    return block.pattern.params[uniformName]?.value ?? null;

  let time = localTime;
  for (const variation of variations) {
    if (time < variation.duration) return variation.valueAtTime(time, clamped);
    time -= variation.duration;
  }
  const last = variations[variations.length - 1];
  return last
    ? last.valueAtTime(last.duration, clamped)
    : (block.pattern.params[uniformName]?.value ?? null);
};
