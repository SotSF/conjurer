import { runInAction } from "mobx";

import { Block } from "@/src/types/Block";
import { CurveVariation } from "@/src/types/Variations/CurveVariation";
import { DEFAULT_VARIATION_DURATION } from "@/src/utils/time";

/**
 * Sets a numeric pattern param and syncs a flat curve region for serialization,
 * matching {@link VJNumberParameterControl} in flat mode (`params/number/VJParameterControl`).
 */
export function setBlockNumberParameterValue(
  block: Block,
  uniformName: string,
  value: number,
): void {
  const param =
    block.pattern.params[uniformName as keyof typeof block.pattern.params];
  if (!param || typeof param.value !== "number") return;

  param.value = value;

  runInAction(() => {
    if (!block.parameterVariations[uniformName])
      block.parameterVariations[uniformName] = [];

    block.parameterVariations[uniformName]![0] = CurveVariation.flat(
      DEFAULT_VARIATION_DURATION,
      value,
    );
  });
}
