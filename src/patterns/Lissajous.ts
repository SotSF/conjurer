import { Pattern } from "@/src/types/Pattern";
import lissajous from "./shaders/lissajous.frag";
import { Palette } from "../types/Palette";
import { Vector3 } from "three";

export { lissajous };
export const Lissajous = () =>
  new Pattern("Lissajous", lissajous, {
    u_count: {
      name: "Count",
      value: 8
    },
    u_space: {
      name: "Interval",  
      value: 0.05
    },
    u_a0: {
      name: "Amplitude - X",
      value: 1
    },
    u_b0: {
      name: "Amplitude - Y",
      value: 1
  },
    u_a1: {
      name: "Frequency - X",
      value: 2
    },
    u_b1: {
      name: "Frequency - Y",
      value: 3
    },
    u_palette: {
      name: "Palette",
      value: new Palette(
          new Vector3(0.5,0.5,0.5),
          new Vector3(0.5,0.5,0.194),
          new Vector3(1.0,0.608,1.0),
          new Vector3(0.468,0.198,0.557)
        )
    }
  });