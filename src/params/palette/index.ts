import { createParamType } from "@/src/params/shared/ParamDefinition";
import { Palette } from "./Palette";
import { isPaletteParam } from "./isPaletteParam";
import { PaletteParameterControl as ParameterControl } from "./ParameterControl";
import { VJPaletteParameterControl as VJParameterControl } from "./VJParameterControl";
import { PaletteNewVariationButtons as NewVariationButtons } from "./NewVariationButtons";

export { Palette, isPalette, type SerializedPalette } from "./Palette";
export { PaletteVariation } from "./variation/PaletteVariation";
export { PaletteVariationControls } from "./variation/VariationControls";
export { PaletteVariationGraph } from "./variation/VariationGraph";
export { PaletteEditor } from "./editor/PaletteEditor";
export { PaletteEditorModal } from "./editor/PaletteEditorModal";

export const PaletteParamDefinition = createParamType<Palette>({
  isParamType: isPaletteParam,
  ParameterControl,
  VJParameterControl,
  NewVariationButtons,
});
