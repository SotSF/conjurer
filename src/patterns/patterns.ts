import { Pattern } from "@/src/types/Pattern";
import { Clouds, clouds } from "@/src/patterns/Clouds";
import { Disc, disc } from "@/src/patterns/Disc";
import { SunCycle, sunCycle } from "@/src/patterns/SunCycle";
import { LogSpirals, logSpirals } from "@/src/patterns/LogSpirals";
import { Barcode, barcode } from "@/src/patterns/Barcode";
import { Pulse, pulse } from "@/src/patterns/Pulse";
import { Fire, fire } from "@/src/patterns/Fire";
import { Melt, melt } from "@/src/patterns/Melt";
import { Tunnel, tunnel } from "@/src/patterns/Tunnel";
import { Rainbow, rainbow } from "@/src/patterns/Rainbow";
import { Starfield, starfield } from "@/src/patterns/Starfield";
import { Globules, globules } from "@/src/patterns/Globules";

// Importing the fragment shaders and doing a no-op on them means that nextJS will recompute the
// patterns whenever a shader is changed. This essentially allows us to hot-reload shaders.
void clouds;
void disc;
void sunCycle;
void logSpirals;
void barcode;
void pulse;
void fire;
void melt;
void tunnel;
void rainbow;
void starfield;
void globules;

const patterns: Pattern[] = [
  LogSpirals(),
  Barcode(),
  Clouds(),
  Disc(),
  Fire(),
  Globules(),
  Melt(),
  Pulse(),
  Rainbow(),
  Starfield(),
  SunCycle(),
  Tunnel(),
];

const patternMap: { [key: string]: Pattern } = {};
for (const pattern of patterns) patternMap[pattern.name] = pattern;

export { patterns, patternMap };
