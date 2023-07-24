import { ParamType } from "@/src/types/PatternParams";

export type RootStore = {
  audioStore: { getPeakAtTime: (time: number) => number };
};

type VariationType =
  | "flat"
  | "linear"
  | "periodic"
  | "spline"
  | "easing"
  | "audio"
  | "linear4"
  | "palette";

export abstract class Variation<T extends ParamType = ParamType> {
  id: string = Math.random().toString(16).slice(2); // unique id
  type: VariationType;
  duration: number;

  abstract displayName: string;

  constructor(type: VariationType, duration: number) {
    this.type = type;
    this.duration = duration;
  }

  abstract valueAtTime: (time: number, globalTime: number) => T;
  abstract computeDomain: () => [number, number];
  abstract computeSampledData: (
    duration: number,
    globalStartTime?: number
  ) => { value: number }[];
  abstract clone: () => Variation<T>;
  abstract serialize: () => any;
  static deserialize: (store: RootStore, data: any) => Variation;
}
