import { CircleOfPipe } from "@/src/patterns/CircleOfPipe";
import { PipeTime } from "@/src/patterns/PipeTime";
import { BoxTime } from "@/src/patterns/BoxTime";
import { Lightwaves } from "@/src/patterns/Lightwaves";
import { Pattern } from "@/src/types/Pattern";
import { Clouds } from "@/src/patterns/Clouds";
import { Disc } from "@/src/patterns/Disc";
import { SunCycle } from "@/src/patterns/SunCycle";
import { GentleRings } from "@/src/patterns/GentleRings";
import { LogSpirals } from "@/src/patterns/LogSpirals";
import { Barcode } from "@/src/patterns/Barcode";
import { Pulse } from "@/src/patterns/Pulse";
import { Fire } from "@/src/patterns/Fire";
import { Melt } from "@/src/patterns/Melt";
import { Tunnel } from "@/src/patterns/Tunnel";
import { Rainbow } from "@/src/patterns/Rainbow";
import { Starfield } from "@/src/patterns/Starfield";
import { SpaceOdyssey } from "@/src/patterns/SpaceOdyssey";
import { Globules } from "@/src/patterns/Globules";
import { Construct } from "@/src/patterns/Construct";
import { EasternRedbud } from "@/src/patterns/EasternRedbud";
import { Convergence } from "@/src/patterns/Convergence";
import { Lissajous } from "@/src/patterns//Lissajous";
import { GradientCircles } from "@/src/patterns//GradientCircles";
import { Perlin } from "@/src/patterns/Perlin";
import { PulsePalette } from "@/src/patterns/PulsePalette";
const patternFactories: Array<() => Pattern> = [
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
  Starfield,
  SpaceOdyssey,
  SunCycle,
  Tunnel,
  Construct,
  EasternRedbud,
  Convergence,
  CircleOfPipe,
  PipeTime,
  BoxTime,
];
// Patterns that will not have their uniforms changed. These are used for checking what the default
// uniform values are.
const defaultPatterns: Pattern[] = patternFactories.map((f) => f());
const defaultPatternMap: {
  [key: string]: Pattern;
} = {};
for (const pattern of defaultPatterns)
  defaultPatternMap[pattern.name] = pattern;
// Patterns that will have their uniforms updated by the pattern playground.
const playgroundPatterns: Pattern[] = patternFactories.map((f) => f());
export { defaultPatternMap, playgroundPatterns };
