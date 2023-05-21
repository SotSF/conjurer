import {
  ExtraParams,
  ParamType,
  PatternParam,
} from "@/src/types/PatternParams";
import { Block } from "@/src/types/Block";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { Vector4 } from "three";

const parameterValueToString = (value: ParamType) => {
  if (typeof value === "number") {
    return value.toFixed(3);
  } else if (value instanceof Vector4) {
    return value
      .toArray()
      .map((v) => v.toFixed(3))
      .join(", ");
  } else {
    return "";
  }
};

type ParameterValueProps = {
  uniformName: string;
  patternParam: PatternParam;
  block: Block<ExtraParams>;
};

export const ParameterValue = observer(function ParameterValue({
  uniformName,
  patternParam,
  block,
}: ParameterValueProps) {
  const { timer } = useStore();
  const { globalTime } = timer;
  void globalTime;

  const value = block.pattern.params[uniformName].value;

  return <>{`: ${parameterValueToString(value)}`}</>;
});
