import { effectFactories } from "@/src/effects/effects";
import { Leaf } from "@/src/effects/Leaf";
import { Shaper } from "@/src/effects/Shaper";
import { patternFactories } from "@/src/patterns/patterns";
import { SunCycle } from "@/src/patterns/SunCycle";
import type { Pattern } from "@/src/types/Pattern";

type PatternFactory = () => Pattern;

/**
 * Which patterns and effects appear on the VJ page.
 */
const vjOmittedPatternFactories = new Set<PatternFactory>([SunCycle]);

const vjOmittedEffectFactories = new Set<PatternFactory>([Shaper, Leaf]);

export const vjPatternFactories: PatternFactory[] = patternFactories.filter(
  (factory) => !vjOmittedPatternFactories.has(factory),
);

export const vjEffectFactories: PatternFactory[] = effectFactories.filter(
  (factory) => !vjOmittedEffectFactories.has(factory),
);

export const vjPatterns: readonly Pattern[] = vjPatternFactories.map((f) =>
  f(),
);

export const vjEffects: readonly Pattern[] = vjEffectFactories.map((f) => f());
