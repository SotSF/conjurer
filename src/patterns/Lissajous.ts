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
        name: "A",
        value: 1
    },
    u_a1: {
        name: "a",
        value: 2
    },
    u_b0: {
        name: "B",
        value: 1
    },
    u_b1: {
        name: "b",
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

  //[[0.518 0.558 -0.112] [1.123 -1.082 1.288] [1.278 -0.332 -0.172] [-0.192 0.308 0.968]]