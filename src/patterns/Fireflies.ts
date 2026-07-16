import { Pattern } from "@/src/types/Pattern";
import { Palette } from "@/src/params/palette/Palette";

import fireflies from "@/src/patterns/shaders/fireflies.frag";

export { fireflies };
export const Fireflies = () =>
  new Pattern("Fireflies", fireflies, {
    u_palette: {
      name: "Palette",
      value: Palette.default(),
    },
    u_timeFactor: {
      name: "Time Factor",
      value: 0.4,
      min: 0.0,
      max: 2.0,
      step: 0.01,
    },
    u_period: {
      name: "Period",
      value: 4.0,
      min: 1.0,
      max: 15.0,
      step: 0.5,
    },
    u_jitter: {
      name: "Jitter",
      value: 1.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
    },
    u_glow: {
      name: "Glow",
      value: 0.5,
      min: 0.05,
      max: 1.0,
      step: 0.01,
    },
    u_threshold: {
      name: "Threshold",
      value: 0.25,
      min: 0.0,
      max: 1.0,
      step: 0.01,
    },
    u_edgeBlack: {
      name: "Edge Black",
      value: 0.15,
      min: 0.0,
      max: 0.5,
      step: 0.01,
    },
    u_colorShift: {
      name: "Color Shift",
      value: 0.05,
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
