import { Pattern } from "@/src/types/Pattern";
import { Palette } from "@/src/params/palette/Palette";

import nebula from "@/src/patterns/shaders/nebula.frag";
import { Vector3 } from "three";

export { nebula };
export const Nebula = () =>
  new Pattern("Nebula", nebula, {
    u_palette: {
      name: "Palette",
      value: new Palette(
        new Vector3(
          0.4578141942070545,
          0.13747096755858157,
          0.6218188281115182,
        ),
        new Vector3(0.4672476443540443, 0.4642310181462297, 0.6766260507523637),
        new Vector3(
          0.17720996009264467,
          0.14253811784468085,
          0.8633613193190549,
        ),
        new Vector3(0.04930616403488419, 0.850407449162364, 0.4605103864304909),
      ),
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
