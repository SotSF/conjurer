import { PaletteParameterControl } from "@/src/components/PatternPlayground/PaletteParameterControl";
import { VJPaletteParameterControl } from "@/src/components/VJPage/VJPaletteParameterControl";
import { isPaletteParam } from "@/src/types/PatternParams";
import { createParamType } from "@/src/paramDefinitions/ParamDefinition";
import { Palette } from "@/src/types/Palette";

export const PaletteParamDefinition = createParamType<Palette>({
  isParamType: isPaletteParam,
  ParameterControl: PaletteParameterControl,
  VJParameterControl: VJPaletteParameterControl,
});
