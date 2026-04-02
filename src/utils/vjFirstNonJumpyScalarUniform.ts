import { Block } from "@/src/types/Block";
import { BASE_UNIFORMS } from "@/src/types/Pattern";
import {
  ExtraParams,
  PatternParam,
  isBooleanParam,
  isNumberParam,
} from "@/src/types/PatternParams";

function isVjMidiScalarTarget(
  uniformName: string,
  patternParam: PatternParam,
): patternParam is PatternParam<number> {
  if (BASE_UNIFORMS.includes(uniformName)) return false;
  if (!isNumberParam(patternParam)) return false;
  if (patternParam.jumpy) return false;
  if (isBooleanParam(patternParam)) return false;
  return true;
}

export type VjMidiScalarTarget = {
  uniformName: string;
  patternParam: PatternParam<number>;
};

/**
 * Same ordering and filters as {@link VJParameterControls} / {@link VJParameterControl}:
 * non-jumpy scalar params (sliders) in panel order, excluding base uniforms and non-number controls.
 */
/** Scalar target plus the block it belongs to (pattern or effect). */
export type VjMidiScalarTargetWithBlock = VjMidiScalarTarget & {
  block: Block<ExtraParams>;
};

/**
 * Flat list matching the VJ sidebar: pattern scalars first (panel order), then each
 * enabled effect’s scalars in selection order — same order as stacked {@link VJParameterControls}.
 */
export function getVjMidiScalarUniformsFlatForEditableStack(
  patternBlock: Block<ExtraParams>,
  effectBlocks: Block<ExtraParams>[],
  selectedEffectIndices: number[],
): VjMidiScalarTargetWithBlock[] {
  const out: VjMidiScalarTargetWithBlock[] = [];
  for (const t of getVjMidiScalarUniformsInOrder(patternBlock)) {
    out.push({ block: patternBlock, ...t });
  }
  for (const ei of selectedEffectIndices) {
    const eb = effectBlocks[ei];
    if (!eb) continue;
    for (const t of getVjMidiScalarUniformsInOrder(eb)) {
      out.push({ block: eb, ...t });
    }
  }
  return out;
}

export function getVjMidiScalarUniformsInOrder(
  block: Block<ExtraParams>,
): VjMidiScalarTarget[] {
  const sorted = Object.entries<PatternParam>(block.pattern.params).sort(
    ([, a], [, b]) => {
      if (a.jumpy && !b.jumpy) return 1;
      if (!a.jumpy && b.jumpy) return -1;
      return 0;
    },
  );

  const out: VjMidiScalarTarget[] = [];
  for (const [uniformName, patternParam] of sorted) {
    if (!isVjMidiScalarTarget(uniformName, patternParam)) continue;
    out.push({ uniformName, patternParam });
  }
  return out;
}

/**
 * Same ordering and filters as {@link VJParameterControls} / {@link VJParameterControl}:
 * non-jumpy params first, then first scalar that is not a boolean toggle or base uniform.
 */
export function getVjFirstNonJumpyScalarUniform(
  block: Block<ExtraParams>,
): VjMidiScalarTarget | null {
  return getVjMidiScalarUniformsInOrder(block)[0] ?? null;
}
