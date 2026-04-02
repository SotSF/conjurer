import { CartesianProjection } from "@/src/effects/CartesianProjection";
import { BrightnessAdjust } from "@/src/effects/BrightnessAdjust";
import { ChromaticAberration } from "@/src/effects/ChromaticAberration";
import { CloudsMask } from "@/src/effects/CloudsMask";
import { ColorTint } from "@/src/effects/ColorTint";
import { ConstructMask } from "@/src/effects/ConstructMask";
import { Kaleidoscope } from "@/src/effects/Kaleidoscope";
import { Rotate } from "@/src/effects/Rotate";
import { ShapeMask } from "@/src/effects/ShapeMask";
import { Tiler } from "@/src/effects/Tiler";
import { Barcode } from "@/src/patterns/Barcode";
import { BloomKaleidoscope } from "@/src/patterns/BloomKaleidoscope";
import { BoxTime } from "@/src/patterns/BoxTime";
import { CircleOfPipe } from "@/src/patterns/CircleOfPipe";
import { Clouds } from "@/src/patterns/Clouds";
import { Convergence } from "@/src/patterns/Convergence";
import { Construct } from "@/src/patterns/Construct";
import { Disc } from "@/src/patterns/Disc";
import { EasternRedbud } from "@/src/patterns/EasternRedbud";
import { Fire } from "@/src/patterns/Fire";
import { GalaxyTour } from "@/src/patterns/GalaxyTour";
import { GentleRings } from "@/src/patterns/GentleRings";
import { Globules } from "@/src/patterns/Globules";
import { GradientCircles } from "@/src/patterns/GradientCircles";
import { Lightwaves } from "@/src/patterns/Lightwaves";
import { Lissajous } from "@/src/patterns/Lissajous";
import { LogSpirals } from "@/src/patterns/LogSpirals";
import { Melt } from "@/src/patterns/Melt";
import { Perlin } from "@/src/patterns/Perlin";
import { PipeTime } from "@/src/patterns/PipeTime";
import { Pulse } from "@/src/patterns/Pulse";
import { PulsePalette } from "@/src/patterns/PulsePalette";
import { Rainbow } from "@/src/patterns/Rainbow";
import { SpaceOdyssey } from "@/src/patterns/SpaceOdyssey";
import { Starfield } from "@/src/patterns/Starfield";
import { Tunnel } from "@/src/patterns/Tunnel";
import { Turbine } from "@/src/patterns/Turbine";
import type { Pattern } from "@/src/types/Pattern";

/**
 * VJ page only: which patterns and effects appear in the picker (subset of playground).
 * Other routes still use `playgroundPatterns` / `playgroundEffects`.
 *
 * Same shape as `patternFactories` / `effectFactories` in patterns.ts / effects.ts:
 * an array of `() => Pattern` factories. Order is the order shown in the VJ UI.
 */
export const vjPatternFactories: ReadonlyArray<() => Pattern> = [
  PulsePalette,
  LogSpirals,
  Lightwaves,
  Barcode,
  Clouds,
  Disc,
  Fire,
  GentleRings,
  Globules,
  GradientCircles,
  Lissajous,
  Melt,
  Perlin,
  Pulse,
  Rainbow,
  GalaxyTour,
  Starfield,
  SpaceOdyssey,
  Tunnel,
  BloomKaleidoscope,
  Turbine,
  Construct,
  EasternRedbud,
  Convergence,
  CircleOfPipe,
  PipeTime,
  BoxTime,
];

export const vjEffectFactories: ReadonlyArray<() => Pattern> = [
  Kaleidoscope,
  ShapeMask,
  Tiler,
  BrightnessAdjust,
  ColorTint,
  CartesianProjection,
  Rotate,
  ChromaticAberration,
  CloudsMask,
  ConstructMask,
];

export const vjPatterns: readonly Pattern[] = vjPatternFactories.map((f) =>
  f(),
);

export const vjEffects: readonly Pattern[] = vjEffectFactories.map((f) => f());
