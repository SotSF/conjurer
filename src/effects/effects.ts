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

const effects: Pattern[] = [
  Tiler(),
  Shaper(),
  Leaf(),
  ColorTint(),
  CartesianProjection(),
  Rotate(),
  ChromaticAberration(),
  CloudsMask(),
  ConstructMask(),
];

const effectMap: { [key: string]: Pattern } = {};
for (const effect of effects) effectMap[effect.name] = effect;

export { effects, effectMap };
