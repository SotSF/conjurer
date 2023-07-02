import { Palette } from "@/src/types/Palette";
import { Variation } from "@/src/types/Variations/Variation";

export class PaletteVariation extends Variation<Palette> {
  displayName = "Palette";
  palette: Palette;

  constructor(duration: number, palette: Palette) {
    super("linear4", duration);

    this.palette = new Palette(
      palette.a.clone(),
      palette.b.clone(),
      palette.c.clone(),
      palette.d.clone()
    );
  }

  valueAtTime = (time: number) => this.palette;

  // currently meaningless
  computeDomain = () => [0, 1] as [number, number];
  computeSampledData = (duration: number) => [{ value: 0 }];

  clone = () => new PaletteVariation(this.duration, this.palette);

  serialize = () => ({
    type: this.type,
    duration: this.duration,
    palette: this.palette.serialize(),
  });

  static deserialize = (data: any) =>
    new PaletteVariation(
      data.duration,
      new Palette(
        data.palette.a,
        data.palette.b,
        data.palette.c,
        data.palette.d
      )
    );
}
