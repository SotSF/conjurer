import { ParamType } from "@/src/types/PatternParams";

type VariationType = "flat" | "linear" | "periodic" | "spline" | "linear4";

export abstract class Variation<T extends ParamType = ParamType> {
  id: string = Math.random().toString(16).slice(2); // unique id
  type: VariationType;
  duration: number;

  abstract displayName: string;

  constructor(type: VariationType, duration: number) {
    this.type = type;
    this.duration = duration;
  }

  abstract valueAtTime: (time: number) => T;
  abstract computeDomain: () => [number, number];
  abstract computeSampledData: (duration: number) => { value: number }[];
  abstract clone: () => Variation<T>;
  abstract serialize: () => any;
  static deserialize: (data: any) => Variation;
}
