import { Pattern } from "@/src/types/Pattern";
import colorRemap from "./shaders/colorRemap.frag";
import { Palette } from "@/src/params/palette/Palette";
import { Vector3 } from "three";

export { colorRemap };
export const ColorRemap = () =>
  new Pattern(
    "Color Remap",
    colorRemap,
    {
      u_hue_shift: {
        name: "Hue Shift",
        value: 0,
        min: 0,
        max: 1,
        step: 0.01,
      },
      u_saturation: {
        name: "Saturation",
        value: 1,
        min: 0,
        max: 2,
        step: 0.01,
      },
      u_invert: {
        name: "Invert",
        value: 0,
        min: 0,
        max: 1,
        step: 0.01,
      },
      u_posterize: {
        name: "Posterize",
        value: 0,
        min: 0,
        max: 32,
        step: 1,
        jumpy: true,
      },
      u_palette: {
        name: "Palette",
        // Classic full-spectrum cosine palette (Inigo Quilez), so gradient-map mode reads as a
        // rainbow out of the box until the artist dials in their own gradient.
        value: new Palette(
          new Vector3(0.5, 0.5, 0.5),
          new Vector3(0.5, 0.5, 0.5),
          new Vector3(1, 1, 1),
          new Vector3(0, 0.33, 0.67),
        ),
      },
      u_palette_mix: {
        name: "Palette Mix",
        value: 0,
        min: 0,
        max: 1,
        step: 0.01,
      },
      u_mask_lo: {
        name: "Mask Low",
        value: 0,
        min: 0,
        max: 1,
        step: 0.01,
      },
      u_mask_hi: {
        name: "Mask High",
        value: 0,
        min: 0,
        max: 1,
        step: 0.01,
      },
    },
    ["v_normalized_uv"],
  );
