import { createParamType } from "@/src/params/shared/ParamDefinition";
import { ScalarParameterControl as ParameterControl } from "./ParameterControl";
import { VJScalarParameterControl as VJParameterControl } from "./VJParameterControl";
import { ScalarNewVariationButtons as NewVariationButtons } from "./NewVariationButtons";
import { isNumberParam } from "./isNumberParam";

// explicit nominal typing would be better

export const NumberParamDefinition = createParamType<number>({
  isParamType: isNumberParam,
  ParameterControl,
  VJParameterControl,
  NewVariationButtons,
});
