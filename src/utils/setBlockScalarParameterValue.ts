import { runInAction } from "mobx";

import { Block } from "@/src/types/Block";
import { ExtraParams } from "@/src/types/PatternParams";
import { FlatVariation } from "@/src/types/Variations/FlatVariation";
import { DEFAULT_VARIATION_DURATION } from "@/src/utils/time";

/**
 * Sets a numeric pattern param and syncs a flat variation for serialization,
 * matching {@link VJScalarParameterControl} in flat mode.
 */
export function setBlockScalarParameterValue(
  block: Block<ExtraParams>,
  uniformName: string,
  value: number,
): void {
  const param = block.pattern.params[uniformName as keyof typeof block.pattern.params];
  if (!param || typeof param.value !== "number") return;

  param.value = value;

  runInAction(() => {
    if (!block.parameterVariations[uniformName])
      block.parameterVariations[uniformName] = [];

    block.parameterVariations[uniformName]![0] = new FlatVariation(
      DEFAULT_VARIATION_DURATION,
      value,
    );
  });
}
