import { defaultPatternMap } from "@/src/patterns/patterns";
import { defaultEffectMap } from "@/src/effects/effects";
import { Opacity } from "@/src/patterns/Opacity";
import { Pattern } from "@/src/types/Pattern";

const opacityPattern = Opacity();

export const defaultPatternEffectMap: Record<string, Pattern> = {
  ...defaultPatternMap,
  ...defaultEffectMap,
  [opacityPattern.name]: opacityPattern,
};
