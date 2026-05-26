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
type ParamDefinition<T extends ParamType> = {
  isParamType: (param: PatternParam) => param is PatternParam<T>;

  ParameterControl: ParameterControl<T>;
  VJParameterControl: VJParameterControl<T>;
};

type ParameterControlOtherProps = {
  block: Block<ExtraParams>;
  uniformName: string;
};
type ParameterControl<T extends ParamType> = React.FC<
  ParameterControlOtherProps & {
    patternParam: PatternParam<T>;
  }
>;

type VJParameterControlOtherProps = {
  block: Block<ExtraParams>;
  uniformName: string;
};

type VJParameterControl<T extends ParamType> = React.FC<
  VJParameterControlOtherProps & {
    patternParam: PatternParam<T>;
  }
>;

export const createParamType = <T extends ParamType>({
  isParamType,
  ParameterControl,
  VJParameterControl,
}: ParamDefinition<T>) => ({
  renderControl: (
    param: PatternParam<any>,
    props: ParameterControlOtherProps,
  ): React.ReactNode | void => {
    if (isParamType(param)) {
      return <ParameterControl patternParam={param} {...props} />;
    }
  },

  renderVJControl: (
    param: PatternParam<any>,
    props: VJParameterControlOtherProps,
  ): React.ReactNode | void => {
    if (isParamType(param)) {
      return <VJParameterControl patternParam={param} {...props} />;
    }
  },
});
