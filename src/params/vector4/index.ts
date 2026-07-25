import { createParamType } from "@/src/params/shared/ParamDefinition";
import { Vector4 } from "three";
import { ColorParameterControl as ParameterControl } from "./ParameterControl";
import { VJColorParameterControl as VJParameterControl } from "./VJParameterControl";
import { Vector4NewVariationButtons as NewVariationButtons } from "./NewVariationButtons";
import { isVector4Param } from "./isVector4Param";

export const Vector4ParamDefinition = createParamType<Vector4>({
  isParamType: isVector4Param,
  ParameterControl,
  VJParameterControl,
  NewVariationButtons,
});
