import { Pattern } from "@/src/types/Pattern";
import { Palette } from "@/src/params/palette/Palette";

import plasma from "@/src/patterns/shaders/plasma.frag";

export { plasma };
export const Plasma = () =>
  new Pattern("Plasma", plasma, {
    u_palette: {
      name: "Palette",
      value: Palette.default(),
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
