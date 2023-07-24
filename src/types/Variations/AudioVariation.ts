import { Variation } from "@/src/types/Variations/Variation";

export class AudioVariation extends Variation<number> {
  displayName = "Audio";
  factor: number;
  offset: number;

  constructor(duration: number, factor: number, offset: number) {
    super("audio", duration);

    this.factor = factor;
    this.offset = offset;
  }

  valueAtTime = (time: number) => {
    // TODO:
    return 1;
  };

  // TODO:
  computeDomain = () => [0, 1] as [number, number];

  computeSampledData = (duration: number) => {
    const totalSamples = Math.ceil(duration * 10);

    const data = [];
    for (let i = 0; i < totalSamples; i++) {
      data.push({
        value: this.valueAtTime(duration * (i / (totalSamples - 1))),
      });
    }
    return data;
  };

  clone = () => new AudioVariation(this.duration, this.factor, this.offset);

  serialize = () => ({
    type: this.type,
    duration: this.duration,
    factor: this.factor,
    offset: this.offset,
  });

  static deserialize = (data: any) =>
    new AudioVariation(data.duration, data.factor, data.offset);
}
