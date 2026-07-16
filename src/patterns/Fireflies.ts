import { Pattern } from "@/src/types/Pattern";
import { Palette } from "@/src/params/palette/Palette";

import fireflies from "@/src/patterns/shaders/fireflies.frag";
import { Vector3 } from "three";

export { fireflies };
export const Fireflies = () =>
  new Pattern("Fireflies", fireflies, {
    u_palette: {
      name: "Palette",
      value: new Palette(
        new Vector3(
          0.9124527182847688,
          0.35201719030020073,
          0.22607142640425104,
        ),
        new Vector3(
          0.08661284008429093,
          0.9683164334331708,
          0.6575666533654505,
        ),
        new Vector3(0.6544835024461954, 0.8646366284628692, 0.673712935060783),
        new Vector3(
          0.5750644351786812,
          0.16811504964194957,
          0.7065968595480202,
        ),
      ),
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
      value: 14.0,
      min: 1.0,
      max: 30.0,
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
      value: 0.19,
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
      value: 0.1,
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
