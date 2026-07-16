import { Pattern } from "@/src/types/Pattern";
import { Palette } from "@/src/params/palette/Palette";

import nebula from "@/src/patterns/shaders/nebula.frag";

export { nebula };
export const Nebula = () =>
  new Pattern("Nebula", nebula, {
    u_palette: {
      name: "Palette",
      value: Palette.default(),
    },
    u_timeFactor: {
      name: "Time Factor",
      value: 0.2,
      min: 0.0,
      max: 1.0,
      step: 0.01,
    },
    u_period: {
      name: "Period",
      value: 2.5,
      min: 0.5,
      max: 8.0,
      step: 0.1,
    },
    u_warp: {
      name: "Warp",
      value: 0,
      min: 0.0,
      max: 6.0,
      step: 0.05,
    },
    u_octaves: {
      name: "Octaves",
      value: 5,
      min: 1,
      max: 10,
      step: 1,
    },
    u_threshold: {
      name: "Threshold",
      value: 0.47,
      min: 0.0,
      max: 1.0,
      step: 0.01,
    },
    u_softness: {
      name: "Softness",
      value: 0.17,
      min: 0.01,
      max: 1.0,
      step: 0.01,
    },
    u_colorShift: {
      name: "Color Shift",
      value: 0.12,
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
