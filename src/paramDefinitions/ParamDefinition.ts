import {
  ExtraParams,
  ParamType,
  PatternParam,
} from "@/src/types/PatternParams";
import { Block } from "@/src/types/Block";
import React from "react";

// Would be good to remove ParamType constraint
// but really this is a function of what can be passed into a shader uniform (not yet abstracted)
// Maybe there's a world where that's generic, part of param definition is a shader that provides a function?
export type ParamDefinition<T extends ParamType> = {
  isParamType: (param: PatternParam) => param is PatternParam<T>;

  ParameterControl: ParameterControl<T>;
  VJParameterControl: VJParameterControl<T>;
};

type ParameterControl<T extends ParamType> = React.FC<{
  block: Block<ExtraParams>;
  uniformName: string;
  patternParam: PatternParam<T>;
  parameters: Record<string, ParamType>; // what is this? why multiple params on a single param?
  setParameters: (params: Record<string, ParamType>) => void;
}>;

type VJParameterControl<T extends ParamType> = React.FC<{
  block: Block<ExtraParams>;
  uniformName: string;
  patternParam: PatternParam<T>;
  parameters: Record<string, ParamType>;
  setParameters: (params: Record<string, ParamType>) => void;
}>;
