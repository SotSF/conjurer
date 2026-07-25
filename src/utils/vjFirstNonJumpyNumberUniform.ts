import { Block } from "@/src/types/Block";
import { BASE_UNIFORMS } from "@/src/types/Pattern";
import { PatternParam } from "@/src/params/shared/patternParam";
import { isBooleanParam } from "@/src/params/boolean/isBooleanParam";
import { isNumberParam } from "@/src/params/number/isNumberParam";

function isVjMidiNumberTarget(
  uniformName: string,
  patternParam: PatternParam,
): patternParam is PatternParam<number> {
  if (BASE_UNIFORMS.includes(uniformName)) return false;
  if (!isNumberParam(patternParam)) return false;
  if (patternParam.jumpy) return false;
  if (isBooleanParam(patternParam)) return false;
  return true;
}

export type VjMidiNumberTarget = {
  uniformName: string;
  patternParam: PatternParam<number>;
};

/**
 * Same ordering and filters as {@link VJParameterControls} / {@link VJParameterControl}:
 * non-jumpy number params (sliders) in panel order, excluding base uniforms and non-number controls.
 */
/** Number target plus the block it belongs to (pattern or effect). */
export type VjMidiNumberTargetWithBlock = VjMidiNumberTarget & {
  block: Block;
};

/**
 * Flat list matching the VJ sidebar: pattern number params first (panel order), then each
 * enabled effect’s number params in selection order — same order as stacked {@link VJParameterControls}.
 */
export function getVjMidiNumberUniformsFlatForEditableStack(
  patternBlock: Block,
  effectBlocks: Block[],
  selectedEffectIndices: number[],
): VjMidiNumberTargetWithBlock[] {
  const out: VjMidiNumberTargetWithBlock[] = [];
  for (const t of getVjMidiNumberUniformsInOrder(patternBlock)) {
    out.push({ block: patternBlock, ...t });
  }
  for (const ei of selectedEffectIndices) {
    const eb = effectBlocks[ei];
    if (!eb) continue;
    for (const t of getVjMidiNumberUniformsInOrder(eb)) {
      out.push({ block: eb, ...t });
    }
  }
  return out;
}

export function getVjMidiNumberUniformsInOrder(
  block: Block,
): VjMidiNumberTarget[] {
  const sorted = Object.entries<PatternParam>(block.pattern.params).sort(
    ([, a], [, b]) => {
      if (a.jumpy && !b.jumpy) return 1;
      if (!a.jumpy && b.jumpy) return -1;
      return 0;
    },
  );

  const out: VjMidiNumberTarget[] = [];
  for (const [uniformName, patternParam] of sorted) {
    if (!isVjMidiNumberTarget(uniformName, patternParam)) continue;
    out.push({ uniformName, patternParam });
  }
  return out;
}

/**
 * Same ordering and filters as {@link VJParameterControls} / {@link VJParameterControl}:
 * non-jumpy params first, then first number param that is not a boolean toggle or base uniform.
 */
export function getVjFirstNonJumpyNumberUniform(
  block: Block,
): VjMidiNumberTarget | null {
  return getVjMidiNumberUniformsInOrder(block)[0] ?? null;
}
