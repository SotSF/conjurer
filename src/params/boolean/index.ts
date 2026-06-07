import { createParamType } from "@/src/params/shared/ParamDefinition";
import { BooleanParameterControl as ParameterControl } from "./ParameterControl";
import { VJBooleanParameterControl as VJParameterControl } from "./VJParameterControl";
import { ScalarNewVariationButtons as NewVariationButtons } from "@/src/params/number/NewVariationButtons";
import { isBooleanParam } from "./isBooleanParam";

export const BooleanParamDefinition = createParamType<0 | 1>({
  isParamType: isBooleanParam,
  ParameterControl,
  VJParameterControl,
  // Under the hood, a boolean is a number/scalar — reuse scalar variation controls so the user
  // can break out of 0 | 1 if they so desire.
  NewVariationButtons,
});
