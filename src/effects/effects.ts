import { Pattern } from "@/src/types/Pattern";
import { CartesianProjection } from "@/src/effects/CartesianProjection";
import { ColorTint } from "@/src/effects/ColorTint";
import { Shaper } from "@/src/effects/Shaper";
import { Leaf } from "@/src/effects/Leaf";
import { Rotate } from "./Rotate";
import { ChromaticAberration } from "./ChromaticAberration";
import { Tiler } from "@/src/effects/Tiler";
import { CloudsMask, cloudsMask } from "@/src/effects/CloudsMask";

// Importing the fragment shaders and doing a no-op on them means that nextJS will recompute the
// effects whenever a shader is changed. This essentially allows us to hot-reload shaders.
void CartesianProjection;
void ColorTint;
void Shaper;
void Leaf;
void Rotate;
void ChromaticAberration;
void Tiler;
void CloudsMask;

const effects: Pattern[] = [
  Tiler(),
  Shaper(),
  Leaf(),
  ColorTint(),
  CartesianProjection(),
  Rotate(),
  ChromaticAberration(),
  CloudsMask(),
];

const effectMap: { [key: string]: Pattern } = {};
for (const effect of effects) effectMap[effect.name] = effect;

export { effects, effectMap };
