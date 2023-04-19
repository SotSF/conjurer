import Variation from "@/src/types/Variations/Variation";
import { Vector4 } from "three";

export default class LinearVariation4 extends Variation<Vector4> {
  from: Vector4;
  to: Vector4;

  // instantiate this once, so we don't have to create a new one every time
  interpolated = new Vector4();

  constructor(duration: number, from: Vector4, to: Vector4) {
    super("linear", duration);

    this.from = from;
    this.to = to;
  }

  valueAtTime = (time: number) =>
    this.interpolated.lerpVectors(this.from, this.to, time / this.duration);

  // currently meaningless
  computeDomain = () => [0, 1] as [number, number];

  computeSampledData = (duration: number) => [
    {
      value: this.from.x,
    },
    {
      value: this.to.x,
    },
  ];
}