import { Variation } from "@/src/types/Variations/Variation";

export class FlatVariation extends Variation<number> {
  value: number;

  constructor(duration: number, value: number) {
    super("flat", duration);

    this.value = value;
  }

  valueAtTime = () => this.value;

  computeDomain = () => [this.value, this.value] as [number, number];

  computeSampledData = (duration: number) => {
    return [
      {
        value: this.value,
      },
      {
        value: this.value,
      },
    ];
  };

  clone = () => new FlatVariation(this.duration, this.value);

  serialize = () => ({
    type: this.type,
    duration: this.duration,
    value: this.value,
  });

  static deserialize = (data: any) =>
    new FlatVariation(data.duration, data.value);
}
