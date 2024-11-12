import { Variation, RootStore } from "@/src/types/Variations/Variation";

export class AudioVariation extends Variation<number> {
  displayName = "Audio";
  factor: number;
  offset: number;
  smoothing: number;

  constructor(
    duration: number,
    factor: number,
    offset: number,
    smoothing: number,
    readonly store: RootStore
  ) {
    super("audio", duration);

    this.factor = factor;
    this.offset = offset;
    this.smoothing = smoothing ?? 0;
  }

  valueAtTime = (time: number, globalTime: number) =>
    this.factor * this.store.audioStore.getSmoothedPeakAtTime(globalTime,this.smoothing) + this.offset;

  // TODO:
  computeDomain = () => [0, 1] as [number, number];

  computeSampledData = (duration: number, globalStartTime = 0) => {
    const totalSamples = Math.ceil(duration * 30);

    const data = [];
    for (let i = 0; i < totalSamples; i++) {
      data.push({
        value: this.valueAtTime(
          0,
          globalStartTime + duration * (i / (totalSamples - 1))
        ),
      });
    }
    return data;
  };

  clone = () =>
    new AudioVariation(
      this.duration,
      this.factor,
      this.offset,
      this.smoothing,
      this.store
    );

  serialize = () => ({
    type: this.type,
    duration: this.duration,
    factor: this.factor,
    offset: this.offset,
  });

  static deserialize = (store: RootStore, data: any) =>
    new AudioVariation(
      data.duration,
      data.factor,
      data.offset,
      data.smoothing,
      store
    );
}
