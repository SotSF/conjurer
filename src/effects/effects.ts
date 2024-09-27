import { Pattern } from "@/src/types/Pattern";
import { CartesianProjection } from "@/src/effects/CartesianProjection";
import { ColorTint } from "@/src/effects/ColorTint";
import { Shaper } from "@/src/effects/Shaper";
import { Leaf } from "@/src/effects/Leaf";
import { Rotate } from "./Rotate";
import { ChromaticAberration } from "./ChromaticAberration";
import { Tiler } from "@/src/effects/Tiler";
import { CloudsMask } from "@/src/effects/CloudsMask";
import { ConstructMask } from "@/src/effects/ConstructMask";
import { BrightnessAdjust } from "./BrightnessAdjust";
import { Kaleidoscope } from "@/src/effects/Kaleidoscope";
import { ShapeMask } from "@/src/effects/ShapeMask";

const effectFactories: Array<() => Pattern> = [
  ShapeMask,
  Tiler,
  Shaper,
  Leaf,
  BrightnessAdjust,
  ColorTint,
  CartesianProjection,
  Rotate,
  ChromaticAberration,
  CloudsMask,
  ConstructMask,
  Kaleidoscope,
];

// Effects that will not have their uniforms changed. These are used for checking what the default
// uniform values are.
const defaultEffects: Pattern[] = effectFactories.map((f) => f());
const defaultEffectMap: { [key: string]: Pattern } = {};
for (const effect of defaultEffects) defaultEffectMap[effect.name] = effect;

// Effects that will have their uniforms updated by the pattern playground.
const playgroundEffects: Pattern[] = effectFactories.map((f) => f());

export { playgroundEffects, defaultEffectMap };
