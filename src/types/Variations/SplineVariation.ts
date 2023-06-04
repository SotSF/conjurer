import { Variation } from "@/src/types/Variations/Variation";
import { CubicSpline } from "splines";

export const DEFAULT_SPLINE_POINTS = [
  { x: 0, y: 0 },
  { x: 0.1, y: 0.4 },
  { x: 0.3, y: 0.45 },
  { x: 0.6, y: 1 },
  { x: 1, y: 0.6 },
];

export class SplineVariation extends Variation<number> {
  displayName = "Spline";
  private _points: { x: number; y: number }[] = [];
  spline: any;
  domainMin: number;
  domainMax: number;

  get points() {
    return this._points;
  }

  set points(points: { x: number; y: number }[]) {
    this._points = points;
    this._computeSpline();
  }

  constructor(
    duration: number,
    points?: { x: number; y: number }[],
    domainMin?: number,
    domainMax?: number
  ) {
    super("spline", duration);

    this.points = points ?? DEFAULT_SPLINE_POINTS;
    this.domainMin = domainMin ?? 0;
    this.domainMax = domainMax ?? 1;
  }

  private _computeSpline = () => {
    const xSeries = [];
    const ySeries = [];
    for (var i = 0; i < this.points.length; i++) {
      xSeries.push(this.points[i].x);
      ySeries.push(this.points[i].y);
    }
    this.spline = new CubicSpline(xSeries, ySeries);
  };

  valueAtTime = (time: number) => {
    const value = this.spline.interpolate(
      // if you pass a value of 1 to interpolate, you get NaN, so we clamp it to 0.99999
      Math.min(time / this.duration, 0.99999)
    );
    return this.domainMin + value * (this.domainMax - this.domainMin);
  };

  computeDomain = () => [this.domainMin, this.domainMax] as [number, number];

  computeSampledData = (duration: number) => {
    const totalSamples = Math.ceil(duration * 4);

    const data = [];
    for (let i = 0; i < totalSamples; i++) {
      data.push({
        value: this.valueAtTime(duration * (i / (totalSamples - 1))),
      });
    }
    return data;
  };

  clone = () =>
    new SplineVariation(
      this.duration,
      this.points,
      this.domainMin,
      this.domainMax
    );

  serialize = () => ({
    type: this.type,
    duration: this.duration,
    points: this.points,
    domainMin: this.domainMin,
    domainMax: this.domainMax,
  });

  static deserialize = (data: any) =>
    new SplineVariation(
      data.duration,
      data.points,
      data.domainMin,
      data.domainMax
    );
}
