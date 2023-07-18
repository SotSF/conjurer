import {
  ExtraParams,
  PatternParam,
  isNumberParam,
  isVector4Param,
} from "@/src/types/PatternParams";
import { Block } from "@/src/types/Block";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";

const parameterToString = (parameter: PatternParam): string => {
  if (isNumberParam(parameter)) return parameter.value.toFixed(3);

  if (isVector4Param(parameter)) {
    const { value } = parameter;
    return [value.x, value.y, value.z, value.w]
      .map((v) => v.toFixed(3))
      .join(", ");
  }

  return "";
};

type ParameterValueProps = {
  uniformName: string;
  block: Block<ExtraParams>;
};

export const ParameterValue = observer(function ParameterValue({
  uniformName,
  block,
}: ParameterValueProps) {
  const { timer } = useStore();
  const { globalTime } = timer;
  void globalTime;

  const parameter = block.pattern.params[uniformName];

  return <>{`: ${parameterToString(parameter)}`}</>;
});
