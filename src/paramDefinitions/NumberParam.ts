import { VJScalarParameterControl } from "@/src/components/VJPage/VJScalarParameterControl";
import { ScalarParameterControl } from "@/src/components/PatternPlayground/ScalarParameterControl";
import { isNumberParam, PatternParam } from "@/src/types/PatternParams";
import { ParamDefinition } from "@/src/paramDefinitions/ParamDefinition";

// explicit nominal typing would be better

// we will later extract this to a shared class
export const NumberParam: ParamDefinition<number> = {
  isParamType: (param: PatternParam): param is PatternParam<number> =>
    isNumberParam(param),

  ParameterControl: ScalarParameterControl,
  VJParameterControl: VJScalarParameterControl,
};
