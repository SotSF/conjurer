import { PatternParam } from "@/src/params/shared/patternParam";
import { isVector4 } from "@/src/utils/object";
import { Vector4 } from "three";

export const isVector4Param = (
  param: PatternParam,
): param is PatternParam<Vector4> => isVector4(param.value);
