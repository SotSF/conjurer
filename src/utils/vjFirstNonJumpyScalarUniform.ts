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
