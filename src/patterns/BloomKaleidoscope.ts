import { Pattern } from "@/src/types/Pattern";
import bloomKaleidoscope from "./shaders/bloomKaleidoscope.frag";
import { Palette } from "../types/Palette";

export { bloomKaleidoscope };

export const BloomKaleidoscope = () =>
  new Pattern("Bloom Kaleidoscope", bloomKaleidoscope, {
    u_palette: {
      name: "Palette",
      value: Palette.default(),
    },
    u_reflectCount: {
      name: "Reflections",
      value: 8,
      min: 1,
      max: 16,
      step: 1,
    },
    u_zoom: {
      name: "Zoom",
      value: 2.5,
      min: 0.4,
      max: 5,
      step: 0.01,
    },
    u_timeFactor: {
      name: "Time Factor",
      value: 1,
      min: -5,
      max: 5,
      step: 0.01,
    },
    u_waveFreq: {
      name: "Wave Frequency",
      value: 20.4,
      min: 0.5,
      max: 25,
      step: 0.1,
    },
    u_ringFreq: {
      name: "Ring Frequency",
      value: 24.3,
      min: 0.5,
      max: 25,
      step: 0.1,
    },
    u_colorShift: {
      name: "Color Shift",
      value: 0,
      min: -5,
      max: 5,
      step: 0.01,
    },
    u_bloomRadius: {
      name: "Bloom Radius",
      value: 0.027,
      min: 0,
      max: 0.06,
      step: 0.001,
    },
    u_bloomThreshold: {
      name: "Bloom Threshold",
      value: 0.06,
      min: 0,
      max: 1,
      step: 0.01,
    },
    u_bloomStrength: {
      name: "Bloom Strength",
      value: 2.67,
      min: 0,
      max: 3,
      step: 0.01,
    },
  });
