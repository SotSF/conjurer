import { Pattern } from "@/src/types/Pattern";
import barcode from "./shaders/barcode.frag";
import { Vector3 } from "three";
import { Palette } from "@/src/types/Palette";

export { barcode };
export const Barcode = () =>
  new Pattern("Barcode", barcode, {
    u_palette: {
      name: "Palette",
      value: new Palette(
        new Vector3(
          0.36580276188333016,
          0.3553826073977443,
          0.7736467599012068,
        ),
        new Vector3(0.795467245104679, 0.4005633081459248, 0.5282529157494844),
        new Vector3(0.6811218478945699, 0.5198457582783134, 0.6603209967475498),
        new Vector3(
          0.4217370910042516,
          0.7556708917825915,
          0.18906524442391326,
        ),
      ),
    },
    u_time_factor: {
      name: "Time Factor",
      value: 1,
      min: -5,
      max: 5,
    },
    u_time_offset: {
      name: "Time Offset",
      value: 0,
      min: -5,
      max: 5,
    },
    u_bars: {
      name: "Bars",
      value: 20,
      min: 2,
      max: 100,
      step: 1,
    },
    u_segments: {
      name: "Segments",
      value: 10,
      min: 1,
      max: 100,
      step: 1,
    },
    u_refresh_period: {
      name: "Refresh Period",
      value: 4,
      min: 0,
      max: 10,
    },
    u_bar_fade_factor: {
      name: "Bar Fade Factor",
      value: 0.25,
    },
    u_bar_likelihood: {
      name: "Bar Likelihood",
      value: 0.5,
    },
  });
