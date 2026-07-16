import { Pattern } from "@/src/types/Pattern";
import { Palette } from "@/src/params/palette/Palette";

import plasma from "@/src/patterns/shaders/plasma.frag";
import { Vector3 } from "three";

export { plasma };
export const Plasma = () =>
  new Pattern("Plasma", plasma, {
    u_palette: {
      name: "Palette",
      value: new Palette(
        new Vector3(
          0.47967221822927486,
          0.4112174018764163,
          0.5648945880898314,
        ),
        new Vector3(0.848554322039427, 0.9881387017846937, 0.5292205015158838),
        new Vector3(0.2527375059891426, 0.9059075704747941, 0.9918541100325586),
        new Vector3(
          0.5850150146759521,
          0.3051078711938151,
          0.34256605961312814,
        ),
      ),
    },
    u_timeFactor: {
      name: "Time Factor",
      value: 0.3,
      min: 0.0,
      max: 1.0,
      step: 0.01,
    },
    u_period: {
      name: "Period",
      value: 3.0,
      min: 0.5,
      max: 10.0,
      step: 0.1,
    },
    u_warp: {
      name: "Warp",
      value: 2.25,
      min: 0.0,
      max: 4.0,
      step: 0.05,
    },
    u_octaves: {
      name: "Octaves",
      value: 1,
      min: 1,
      max: 6,
      step: 1,
    },
    u_threshold: {
      name: "Threshold",
      value: 0.9,
      min: 0.0,
      max: 1.0,
      step: 0.01,
    },
    u_sharpness: {
      name: "Sharpness",
      value: 2.0,
      min: 0.5,
      max: 8.0,
      step: 0.1,
    },
    u_colorShift: {
      name: "Color Shift",
      value: 0.08,
      min: 0.0,
      max: 1.0,
      step: 0.01,
    },
    u_seed: {
      name: "Seed",
      value: 0.0,
      min: 0.0,
      max: 100.0,
      step: 1.0,
    },
  });
