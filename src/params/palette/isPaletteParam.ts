import { PatternParam } from "@/src/params/shared/patternParam";
import { isPalette, Palette } from "./Palette";

export const isPaletteParam = (
  param: PatternParam,
): param is PatternParam<Palette> => isPalette(param.value);
