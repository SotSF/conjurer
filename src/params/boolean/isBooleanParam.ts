import { PatternParam } from "@/src/params/shared/patternParam";

export const isBooleanParam = (
  param: PatternParam,
): param is PatternParam<0 | 1> =>
  typeof param.value === "number" &&
  param.min === 0 &&
  param.max === 1 &&
  param.step === 1;
