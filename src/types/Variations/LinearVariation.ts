import Variation from "@/src/types/Variations/Variation";
import { lerp } from "three/src/math/MathUtils";

export default class LinearVariation extends Variation<number> {
  from: number;
  to: number;

  constructor(duration: number, from: number, to: number) {
    super("linear", duration);

    this.from = from;
    this.to = to;
  }

  valueAtTime = (time: number) =>
    lerp(this.from, this.to, time / this.duration);

  computeDomain = () => [this.from, this.to] as [number, number];

  computeSampledData = (duration: number) => [
    {
      value: this.from,
    },
    {
      value: this.to,
    },
  ];

  clone = () => new LinearVariation(this.duration, this.from, this.to);

  serialize = () => ({
    type: this.type,
    duration: this.duration,
    from: this.from,
    to: this.to,
  });

  static deserialize = (data: any) =>
    new LinearVariation(data.duration, data.from, data.to);
}
