import { Clouds } from "@/src/patterns/Clouds";
import { Disc } from "@/src/patterns/Disc";
import { SunCycle } from "@/src/patterns/SunCycle";
import { LogSpirals } from "./LogSpirals";
import { Pattern } from "@/src/types/Pattern";
import { Barcode } from "@/src/patterns/Barcode";
import { Pulse } from "@/src/patterns/Pulse";
import { Fire } from "@/src/patterns/Fire";
import { Melt } from "@/src/patterns/Melt";
import { Tunnel } from "@/src/patterns/Tunnel";
import { Rainbow } from "@/src/patterns/Rainbow";
import { Starfield } from "@/src/patterns/Starfield";
import { Globules } from "@/src/patterns/Globules";

const patterns: Pattern[] = [
  Pulse(),
  Barcode(),
  LogSpirals(),
  Clouds(),
  SunCycle(),
  Tunnel(),
  Fire(),
  Melt(),
  Disc(),
  Rainbow(),
  Starfield(),
  Globules(),
];

const patternMap: { [key: string]: Pattern } = {};
for (const pattern of patterns) {
  patternMap[pattern.name] = pattern;
}

export { patterns, patternMap };
