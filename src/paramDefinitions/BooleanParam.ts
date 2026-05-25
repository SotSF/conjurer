import { ParamDefinition } from "@/src/paramDefinitions/ParamDefinition";
import { isBooleanParam } from "@/src/types/PatternParams";
import { BooleanParameterControl } from "@/src/components/PatternPlayground/BooleanParameterControl";
import { VJBooleanParameterControl } from "@/src/components/VJPage/VJBooleanParameterControl";

export const BooleanParam: ParamDefinition<0 | 1> = {
  isParamType: isBooleanParam,
  ParameterControl: BooleanParameterControl,
  VJParameterControl: VJBooleanParameterControl,
}