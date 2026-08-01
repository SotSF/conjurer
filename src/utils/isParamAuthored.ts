import { Block } from "@/src/types/Block";
import { defaultPatternEffectMap } from "@/src/utils/patternsEffects";
import { Variation } from "@/src/types/Variations/Variation";
import { FlatVariation } from "@/src/types/Variations/FlatVariation";
import { LinearVariation } from "@/src/types/Variations/LinearVariation";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { PaletteVariation } from "@/src/params/palette/variation/PaletteVariation";
import { CurveVariation } from "@/src/types/Variations/CurveVariation";
import { Palette, isPalette } from "@/src/params/palette/Palette";
import { isVector4 } from "@/src/utils/object";

const palettesEqual = (a: Palette, b: Palette) =>
  a.a.equals(b.a) && a.b.equals(b.b) && a.c.equals(b.c) && a.d.equals(b.d);

const valuesEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number") return a === b;
  if (isVector4(a) && isVector4(b)) return a.equals(b);
  if (isPalette(a) && isPalette(b)) return palettesEqual(a, b);
  return false;
};

// A single variation that holds constant at the default value. This is exactly
// the placeholder that serialization synthesizes for un-authored params on save
// (a flat/linear/palette variation carrying the current value) and the palette
// the palette control auto-seeds on mount — neither represents real authoring.
const isConstantAtDefault = (
  variation: Variation,
  defaultValue: unknown,
): boolean => {
  if (variation instanceof FlatVariation)
    return valuesEqual(variation.value, defaultValue);
  if (variation instanceof LinearVariation)
    return (
      valuesEqual(variation.from, defaultValue) &&
      valuesEqual(variation.to, defaultValue)
    );
  if (variation instanceof LinearVariation4)
    return (
      isVector4(defaultValue) &&
      variation.from.equals(defaultValue) &&
      variation.to.equals(defaultValue)
    );
  if (variation instanceof PaletteVariation)
    return (
      isPalette(defaultValue) && palettesEqual(variation.palette, defaultValue)
    );
  // A Curve is un-authored only if it resolves to the flat default everywhere:
  // every node at the default value with no curvature (this is what migration
  // produces for an un-authored param). Any deviating value or bend = authored.
  if (variation instanceof CurveVariation)
    return (
      variation.nodes.length > 0 &&
      variation.nodes.every(
        (n) =>
          valuesEqual(n.value, defaultValue) &&
          Math.abs(n.handleIn.dv) < 1e-9 &&
          Math.abs(n.handleOut.dv) < 1e-9,
      )
    );
  // periodic / audio variations are inherently time-varying
  return false;
};

// Whether the user has authored this param away from its pattern default.
//
// The serialized format synthesizes a constant variation for every param on
// save, and the palette control seeds one on mount, so "has a variation" alone
// marks everything as authored. Instead we compare against the pristine default
// from defaultPatternEffectMap: a param is un-authored when it has no variations
// and its value matches the default, or its single variation holds constant at
// that default value. Any time-varying variation, extra variations, or a value
// that differs from the default counts as authored.
//
// Note: u_opacity is handled separately (via Block.hasManualOpacity) because the
// render pipeline writes the live auto-crossfade value back onto the param.
export const isParamAuthored = (block: Block, uniformName: string): boolean => {
  const defaultValue =
    defaultPatternEffectMap[block.pattern.name]?.params[uniformName]?.value;

  const variations = block.parameterVariations[uniformName];
  if (!variations || variations.length === 0)
    return !valuesEqual(block.pattern.params[uniformName]?.value, defaultValue);

  if (variations.length > 1) return true;
  return !isConstantAtDefault(variations[0], defaultValue);
};
