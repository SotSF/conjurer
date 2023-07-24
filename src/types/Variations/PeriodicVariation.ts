import { RootStore, Variation } from "@/src/types/Variations/Variation";

export type PeriodicVariationType = "sine" | "square" | "triangle";

export class PeriodicVariation extends Variation<number> {
  displayName = "Periodic";
  periodicType: PeriodicVariationType = "sine";
  amplitude: number;
  period: number;
  phase: number;
  offset: number;

  get min() {
    return -this.amplitude + this.offset;
  }

  set min(newMin: number) {
    const oldMax = this.max;
    this.amplitude = (oldMax - newMin) / 2;
    this.offset = newMin + this.amplitude;
  }

  get max() {
    return this.amplitude + this.offset;
  }

  set max(newMax: number) {
    const oldMin = this.min;
    this.amplitude = (newMax - oldMin) / 2;
    this.offset = oldMin + this.amplitude;
  }

  constructor(
    duration: number,
    periodicType: PeriodicVariationType,
    amplitude: number,
    period: number,
    phase: number,
    offset: number
  ) {
    super("periodic", duration);

    this.periodicType = periodicType;
    this.amplitude = amplitude;
    this.period = period;
    this.phase = phase;
    this.offset = offset;
  }

  valueAtTime = (time: number) => {
    switch (this.periodicType) {
      case "sine":
        return (
          Math.sin((time / this.period) * 2 * Math.PI + this.phase) *
            this.amplitude +
          this.offset
        );
      case "square":
        const magnitude = Math.sin(
          (time / this.period) * 2 * Math.PI + this.phase
        );
        const sign = magnitude > 0 ? 1 : -1;
        return sign * this.amplitude + this.offset;
      case "triangle":
        // source: https://www.wikiwand.com/en/Triangle_wave
        return (
          ((4 * this.amplitude) / this.period) *
            Math.abs(
              ((((time - 0.25 * this.period + this.phase) % this.period) +
                this.period) %
                this.period) -
                0.5 * this.period
            ) -
          this.amplitude +
          this.offset
        );
      default:
        return 0;
    }
  };

  computeDomain = () =>
    [-this.amplitude + this.offset, this.amplitude + this.offset] as [
      number,
      number
    ];

  computeSampledData = (duration: number) => {
    const samplingFrequency = 16 / this.period;
    const totalSamples = Math.ceil(duration * samplingFrequency);

    const data = [];
    for (let i = 0; i < totalSamples; i++) {
      data.push({
        value: this.valueAtTime(duration * (i / (totalSamples - 1))),
      });
    }
    return data;
  };

  clone = () =>
    new PeriodicVariation(
      this.duration,
      this.periodicType,
      this.amplitude,
      this.period,
      this.phase,
      this.offset
    );

  serialize = () => ({
    type: this.type,
    duration: this.duration,
    periodicType: this.periodicType,
    amplitude: this.amplitude,
    period: this.period,
    phase: this.phase,
    offset: this.offset,
  });

  static deserialize = (store: RootStore, data: any) =>
    new PeriodicVariation(
      data.duration,
      data.periodicType,
      data.amplitude,
      data.period,
      data.phase,
      data.offset
    );
}
