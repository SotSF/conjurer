import { Pattern } from "@/src/types/Pattern";
import convergence from "./shaders/convergence.frag";
import { Vector3 } from "three";
import { Palette } from "@/src/types/Palette";

export { convergence };
export const Convergence = () =>
  new Pattern("Convergence", convergence, {
    u_palette: {
      name: "Palette",
      value: new Palette(
        new Vector3(0.261, 0.446, 0.315),
        new Vector3(0.843, 0.356, 0.239),
        new Vector3(0.948, 1.474, 1.361),
        new Vector3(3.042, 5.63, 5.424)
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
    u_period: {
      name: "Period",
      value: 6.5,
      min: 1,
      max: 20,
    },
    u_waves: {
      name: "Waves",
      value: 6,
      min: 0,
      max: 30,
      step: 1,
    },
    u_trailing_waves: {
      name: "Trailing Waves",
      value: 2,
      min: 0,
      max: 10,
      step: 1,
    },
    u_wave_size: {
      name: "Wave Size",
      value: 0.05,
    },
    u_wave_travel: {
      name: "Wave Travel",
      value: 1,
    },
    u_wave_fade: {
      name: "Wave Fade",
      value: 1,
    },
    u_stagger: {
      name: "Stagger",
      value: 0,
    },
    u_spread_factor: {
      name: "Spread Factor",
      value: 1,
    },
  });
