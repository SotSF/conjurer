import { Pattern } from "@/src/types/Pattern";
import pulsePalette from "./shaders/pulsePalette.frag";
import { Vector3 } from "three";
import { Palette } from "@/src/types/Palette";

export { pulsePalette };
export const PulsePalette = () =>
  new Pattern("PulsePalette", pulsePalette, {
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
      value: 0.4,
    },
    u_time_offset: {
      name: "Time Offset",
      value: 0,
    },
    u_hue_start: {
      name: "Hue Start",
      value: 0,
    },
    u_hue_width: {
      name: "Hue Width",
      value: 0.8,
    },
    u_saturation: {
      name: "Saturation",
      value: 1,
    },
    u_duty_cycle: {
      name: "Duty Cycle",
      value: 0.5,
    },
    u_scale: {
      name: "Scale",
      value: 1,
    },
    u_wave_period: {
      name: "Wave Period",
      value: 0.25,
    },
    u_wave_amplitude: {
      name: "Wave Amplitude",
      value: 0,
    },
    u_waviness: {
      name: "Waviness",
      value: 1,
    },
    u_spiral_factor: {
      name: "Spiral Factor",
      value: 0,
    },
    u_number_colors: {
      name: "Number of Colors",
      value: 4,
    },
    u_white_leading_edge: {
      name: "White Leading Edge",
      value: 1,
    },
  });
