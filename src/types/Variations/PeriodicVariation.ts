import { Variation } from "@/src/types/Variations/Variation";
import type { Store } from "@/src/types/Store";

export type PeriodicVariationType =
  | "sine"
  | "square"
  | "triangle"
  | "sawUp"
  | "sawDown";

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
    this.amplitude = (this.max - newMin) / 2;
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
    offset: number,
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
          (time / this.period) * 2 * Math.PI + this.phase,
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
                0.5 * this.period,
            ) -
          this.amplitude +
          this.offset
        );
      case "sawUp":
      case "sawDown": {
        // Ramps across one period then jumps back to where it started: sawUp
        // goes min -> max, sawDown goes max -> min. Direction lives in the
        // type rather than in the sign of the amplitude, so min/max stay
        // ordered (a negative amplitude would invert them and hand
        // computeDomain a backwards range). Phase is in radians here (as for
        // sine/square), so a phase of 2*PI advances the ramp by one period.
        const cyclePosition =
          (((time / this.period + this.phase / (2 * Math.PI)) % 1) + 1) % 1;
        const ramp =
          this.periodicType === "sawUp"
            ? 2 * cyclePosition - 1
            : 1 - 2 * cyclePosition;
        return ramp * this.amplitude + this.offset;
      }
      default:
        return 0;
    }
  };

  computeDomain = () =>
    [-this.amplitude + this.offset, this.amplitude + this.offset] as [
      number,
      number,
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

  /**
   * Shift the wave as if local t=0 moved later by `dt` seconds — so a mid-cut
   * remnant (or a left-boundary drag) keeps the same continuous waveform.
   * Sine/square/saws store phase in radians; triangle stores it as a time
   * offset.
   */
  shiftStart = (dt: number) => {
    if (this.periodicType === "triangle") this.phase += dt;
    else if (this.period > 1e-12)
      this.phase += (dt / this.period) * 2 * Math.PI;
  };

  clone = () =>
    new PeriodicVariation(
      this.duration,
      this.periodicType,
      this.amplitude,
      this.period,
      this.phase,
      this.offset,
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

  static deserialize = (store: Store, data: any) =>
    new PeriodicVariation(
      data.duration,
      data.periodicType,
      data.amplitude,
      data.period,
      data.phase,
      data.offset,
    );
}
