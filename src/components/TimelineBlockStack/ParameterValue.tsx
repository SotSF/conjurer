import {
  PatternParam,
  isNumberParam,
  isVector4Param,
} from "@/src/types/PatternParams";
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
  parameter: PatternParam;
};

export const ParameterValue = observer(function ParameterValue({
  parameter,
}: ParameterValueProps) {
  const { audioStore } = useStore();
  void audioStore.globalTime;

  return <>{`: ${parameterToString(parameter)}`}</>;
});
