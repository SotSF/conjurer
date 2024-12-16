import { Variation } from "@/src/types/Variations/Variation";
import type { Store } from "@/src/types/Store";
import { lerp } from "three/src/math/MathUtils";

export class LinearVariation extends Variation<number> {
  displayName = "Linear";
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

  static deserialize = (store: Store, data: any) =>
    new LinearVariation(data.duration, data.from, data.to);
}
