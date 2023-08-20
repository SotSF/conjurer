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
      value: 4,
      max: 10,
    },
    u_duty_cycle: {
      name: "Duty Cycle",
      value: 0.2,
    },
    u_scale: {
      name: "Scale",
      value: 5,
      max: 10,
      step: 0.1,
    },
    u_fade_factor: {
      name: "Fade Factor",
      value: 0.75,
    },
    u_wave_frequency: {
      name: "Wave Frequency",
      value: 4,
      min: 1,
      max: 20,
      step: 1,
    },
    u_wave_amplitude: {
      name: "Wave Amplitude",
      value: 0.5,
    },
    u_waviness: {
      name: "Waviness",
      value: 1,
    },
    u_spiral_factor: {
      name: "Spiral Factor",
      value: 0.5,
    },
    u_number_colors: {
      name: "Number of Colors",
      value: 40,
      min: 1,
      max: 100,
      step: 1,
    },
    u_white_leading_edge: {
      name: "White Leading Edge",
      value: 0.1,
    },
    u_sector_cells: {
      name: "Sector Cells",
      value: 0,
      min: 0,
      max: 96,
      step: 1,
    },
  });
