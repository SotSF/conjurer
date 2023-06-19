import { Variation } from "@/src/types/Variations/Variation";
import { easings } from "@/src/utils/easings";

export type EasingVariationType =
  | "easeInSine"
  | "easeOutSine"
  | "easeInOutSine"
  | "easeInQuad"
  | "easeOutQuad"
  | "easeInOutQuad"
  | "easeInCubic"
  | "easeOutCubic"
  | "easeInOutCubic"
  | "easeInQuart"
  | "easeOutQuart"
  | "easeInOutQuart"
  | "easeInQuint"
  | "easeOutQuint"
  | "easeInOutQuint"
  | "easeInExpo"
  | "easeOutExpo"
  | "easeInOutExpo"
  | "easeInCirc"
  | "easeOutCirc"
  | "easeInOutCirc"
  | "easeInBack"
  | "easeOutBack"
  | "easeInOutBack"
  | "easeInElastic"
  | "easeOutElastic"
  | "easeInOutElastic"
  | "easeInBounce"
  | "easeOutBounce"
  | "easeInOutBounce";

export class EasingVariation extends Variation<number> {
  displayName = "Easing";
  periodicType: EasingVariationType = "easeInSine";
  from: number;
  to: number;

  constructor(
    duration: number,
    easingType: EasingVariationType,
    from: number,
    to: number
  ) {
    super("easing", duration);

    this.periodicType = easingType;
    this.from = from;
    this.to = to;
  }

  valueAtTime = (time: number) =>
    easings[this.periodicType](time / this.duration);

  computeDomain = () =>
    [Math.min(this.from, this.to), Math.max(this.from, this.to)] as [
      number,
      number
    ];

  computeSampledData = (duration: number) => {
    const totalSamples = 50;

    const data = [];
    for (let i = 0; i < totalSamples; i++) {
      data.push({
        value: this.valueAtTime(duration * (i / (totalSamples - 1))),
      });
    }
    return data;
  };

  clone = () =>
    new EasingVariation(this.duration, this.periodicType, this.from, this.to);

  serialize = () => ({
    type: this.type,
    duration: this.duration,
    periodicType: this.periodicType,
    from: this.from,
    to: this.to,
  });

  static deserialize = (data: any) =>
    new EasingVariation(data.duration, data.periodicType, data.from, data.to);
}
