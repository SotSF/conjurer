import { createParamType } from "@/src/params/shared/ParamDefinition";
import { NumberParameterControl as ParameterControl } from "./ParameterControl";
import { VJNumberParameterControl as VJParameterControl } from "./VJParameterControl";
import { NumberNewVariationButtons as NewVariationButtons } from "./NewVariationButtons";
import { isNumberParam } from "./isNumberParam";

// explicit nominal typing would be better

export const NumberParamDefinition = createParamType<number>({
  isParamType: isNumberParam,
  ParameterControl,
  VJParameterControl,
  NewVariationButtons,
});
