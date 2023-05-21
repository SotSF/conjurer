import { Variation } from "@/src/types/Variations/Variation";

type PeriodicVariationType = "sine" | "square" | "sawtooth";

export class PeriodicVariation extends Variation<number> {
  periodicType: PeriodicVariationType = "sine";
  amplitude: number;
  frequency: number;
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
    frequency: number,
    phase: number,
    offset: number
  ) {
    super("periodic", duration);

    this.periodicType = periodicType;
    this.amplitude = amplitude;
    this.frequency = frequency;
    this.phase = phase;
    this.offset = offset;
  }

  valueAtTime = (time: number) => {
    switch (this.periodicType) {
      case "sine":
        return (
          Math.sin(time * this.frequency * 2 * Math.PI + this.phase) *
            this.amplitude +
          this.offset
        );
      case "square":
        const magnitude = Math.sin(
          time * this.frequency * 2 * Math.PI + this.phase
        );
        const sign = magnitude > 0 ? 1 : -1;
        return sign * this.amplitude + this.offset;
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
    const samplingFrequency = 8 * this.frequency;
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
      this.frequency,
      this.phase,
      this.offset
    );

  serialize = () => ({
    type: this.type,
    duration: this.duration,
    periodicType: this.periodicType,
    amplitude: this.amplitude,
    frequency: this.frequency,
    phase: this.phase,
    offset: this.offset,
  });

  static deserialize = (data: any) =>
    new PeriodicVariation(
      data.duration,
      data.periodicType,
      data.amplitude,
      data.frequency,
      data.phase,
      data.offset
    );
}
