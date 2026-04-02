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

/**
 * Same ordering and filters as {@link VJParameterControls} / {@link VJParameterControl}:
 * non-jumpy params first, then first scalar that is not a boolean toggle or base uniform.
 */
export function getVjFirstNonJumpyScalarUniform(
  block: Block<ExtraParams>,
): { uniformName: string; patternParam: PatternParam<number> } | null {
  const sorted = Object.entries<PatternParam>(block.pattern.params).sort(
    ([, a], [, b]) => {
      if (a.jumpy && !b.jumpy) return 1;
      if (!a.jumpy && b.jumpy) return -1;
      return 0;
    },
  );

  for (const [uniformName, patternParam] of sorted) {
    if (!isVjMidiScalarTarget(uniformName, patternParam)) continue;
    return { uniformName, patternParam };
  }

  return null;
}
