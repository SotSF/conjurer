import { ColorParameterControl } from "@/src/components/PatternPlayground/ColorParameterControl";
import { VJColorParameterControl } from "@/src/components/VJPage/VJColorParameterControl";
import { isVector4Param } from "@/src/types/PatternParams";
import { createParamType } from "@/src/paramDefinitions/ParamDefinition";
import { Vector4 } from "three";
import { Vector4NewVariationButtons } from "@/src/components/ParameterVariations/Vector4NewVariationButtons";

export const Vector4ParamDefinition = createParamType<Vector4>({
  isParamType: isVector4Param,
  ParameterControl: ColorParameterControl,
  VJParameterControl: VJColorParameterControl,
  NewVariationButtons: Vector4NewVariationButtons,
});
