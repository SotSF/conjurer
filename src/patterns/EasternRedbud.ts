import { Pattern } from "@/src/types/Pattern";
import easternRedbud from "./shaders/easternRedbud.frag";
import { Vector4 } from "three";

export { easternRedbud };
export const EasternRedbud = () =>
  new Pattern("EasternRedbud", easternRedbud, {
    u_time_factor: {
      name: "Time Factor",
      value: 1,
    },
    u_time_offset: {
      name: "Time Offset",
      value: 0,
    },
    u_iterations: {
      name: "Iterations",
      value: 5,
    },
    u_repetition_period: {
      name: "Repetition Period",
      value: 5,
    },
    u_fade_fraction: {
      name: "Fade Fraction",
      value: 0.2,
    },
    u_thickness: {
      name: "Thickness",
      value: 0.05,
    },
    u_spacing: {
      name: "Spacing",
      value: 0.22,
    },
    u_global_elevation: {
      name: "Global Elevation",
      value: 0.05,
    },
    u_wave_frequency: {
      name: "Wave Frequency",
      value: 5,
    },
    u_wave_amplitude: {
      name: "Wave Amplitude",
      value: 0.5,
    },
    u_wave_elevation_factor: {
      name: "Wave Elevation Factor",
      value: 1.5,
    },
    u_color: {
      name: "Color",
      value: new Vector4(1, 1, 1, 1),
    },
  });
