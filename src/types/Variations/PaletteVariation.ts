import { Palette } from "@/src/types/Palette";
import { RootStore, Variation } from "@/src/types/Variations/Variation";
import { Vector3 } from "three";

export class PaletteVariation extends Variation<Palette> {
  displayName = "Palette";
  palette: Palette;

  constructor(duration: number, palette: Palette) {
    super("palette", duration);

    this.palette = new Palette(
      palette.a.clone(),
      palette.b.clone(),
      palette.c.clone(),
      palette.d.clone(),
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

  static deserialize = (store: RootStore, data: any) =>
    new PaletteVariation(
      data.duration,
      new Palette(
        new Vector3(...data.palette.a),
        new Vector3(...data.palette.b),
        new Vector3(...data.palette.c),
        new Vector3(...data.palette.d),
      ),
    );
}
