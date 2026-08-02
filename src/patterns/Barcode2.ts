import { Pattern } from "@/src/types/Pattern";
import { Palette } from "@/src/params/palette/Palette";
import { Vector3 } from "three";

import barcode2 from "@/src/patterns/shaders/barcode2.frag";

export { barcode2 };
export const Barcode2 = () =>
  new Pattern("Barcode2", barcode2, {
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
    u_seed: {
      name: "Seed",
      value: 0,
      min: 0,
      max: 1000,
      step: 1,
    },
    u_bar_fade_factor: {
      name: "Bar Fade Factor",
      value: 0.25,
    },
    u_bar_likelihood: {
      name: "Bar Likelihood",
      value: 0.25,
    },
    u_tangential_speed: {
      name: "Tangential Speed",
      value: 18,
      min: -100,
      max: 100,
    },
    u_tangential_offset: {
      name: "Tangential Offset",
      value: 0,
      min: -50,
      max: 50,
    },
    // 1 means no mirroring; 2 and up fold the canopy into that many wedges
    u_mirrorCount: {
      name: "Mirror Count",
      value: 8,
      min: 1,
      max: 16,
      step: 1,
    },
    u_angle: {
      name: "Angle",
      value: 0,
      min: 0,
      max: 2,
    },
  });
