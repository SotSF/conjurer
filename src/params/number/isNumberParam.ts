import { PatternParam } from "@/src/params/shared/patternParam";

export const isNumberParam = (
  param: PatternParam,
): param is PatternParam<number> => typeof param.value === "number";
