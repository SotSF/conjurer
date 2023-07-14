import { ExtraParams, ParamType } from "@/src/types/PatternParams";
import { Block } from "@/src/types/Block";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { isVector4 } from "@/src/utils/object";

const parameterValueToString = (value: ParamType) => {
  if (typeof value === "number") {
    return value.toFixed(3);
  } else if (isVector4(value)) {
    return [value.x, value.y, value.z, value.w]
      .map((v) => v.toFixed(3))
      .join(", ");
  } else {
    return "";
  }
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

  const value = block.pattern.params[uniformName].value;

  return <>{`: ${parameterValueToString(value)}`}</>;
});
