import { Pattern } from "@/src/types/Pattern";
import { Clouds } from "@/src/patterns/Clouds";
import { Disc } from "@/src/patterns/Disc";
import { SunCycle } from "@/src/patterns/SunCycle";
import { LogSpirals } from "@/src/patterns/LogSpirals";
import { Barcode } from "@/src/patterns/Barcode";
import { Pulse } from "@/src/patterns/Pulse";
import { Fire } from "@/src/patterns/Fire";
import { Melt } from "@/src/patterns/Melt";
import { Tunnel } from "@/src/patterns/Tunnel";
import { Rainbow } from "@/src/patterns/Rainbow";
import { Starfield } from "@/src/patterns/Starfield";
import { Globules } from "@/src/patterns/Globules";
import { Construct } from "@/src/patterns/Construct";

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
  Construct(),
];

const patternMap: { [key: string]: Pattern } = {};
for (const pattern of patterns) patternMap[pattern.name] = pattern;

export { patterns, patternMap };
