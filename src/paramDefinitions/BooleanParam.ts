import { createParamType } from "@/src/paramDefinitions/ParamDefinition";
import { isBooleanParam } from "@/src/types/PatternParams";
import { BooleanParameterControl } from "@/src/components/PatternPlayground/BooleanParameterControl";
import { VJBooleanParameterControl } from "@/src/components/VJPage/VJBooleanParameterControl";
import { ScalarNewVariationButtons } from "@/src/components/ParameterVariations/ScalarNewVariationButtons";

export const BooleanParamDefinition = createParamType<0 | 1>({
  isParamType: isBooleanParam,
  ParameterControl: BooleanParameterControl,
  VJParameterControl: VJBooleanParameterControl,
  // Under the hood, a boolean is as number/scalar, and we provide scalar controls for booleans so
  // we don't have to reinvent the wheel, and so the user has more control to break out of 0 | 1 if
  // they so desire.
  NewVariationButtons: ScalarNewVariationButtons,
});
