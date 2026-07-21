import { Pattern } from "@/src/types/Pattern";
import perlin2 from "./shaders/perlin2.frag";
import { Palette } from "@/src/params/palette/Palette";

export { perlin2 };
export const Perlin2 = () =>
  new Pattern("Perlin2", perlin2, {
    u_palette: {
      name: "Palette",
      value: Palette.default(),
    },
    u_timeFactor: {
      name: "Time Factor",
      value: 0.5,
    },
    u_colorShift: {
      name: "Color Shift",
      value: 0.5,
    },
    u_seed: {
      name: "Seed",
      value: 0,
    },
    u_steps: {
      name: "Steps",
      value: 5,
      min: 0,
      max: 10,
      step: 1,
    },
    u_period: {
      name: "Period",
      value: 1.0,
      min: 0.1,
      max: 10,
      step: 0.1,
    },
  });
