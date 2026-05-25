import { VJScalarParameterControl } from "@/src/components/VJPage/VJScalarParameterControl";
import { ScalarParameterControl } from "@/src/components/PatternPlayground/ScalarParameterControl";
import { isNumberParam } from "@/src/types/PatternParams";
import { createParamType } from "@/src/paramDefinitions/ParamDefinition";

// explicit nominal typing would be better

export const NumberParamDefinition = createParamType<number>({
  isParamType: isNumberParam,
  ParameterControl: ScalarParameterControl,
  VJParameterControl: VJScalarParameterControl,
});
