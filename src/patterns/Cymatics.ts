import { Pattern } from "@/src/types/Pattern";
import { Palette } from "@/src/types/Palette";
import { Vector3 } from "three";

import cymatics from "@/src/patterns/shaders/cymatics.frag";

export { cymatics };
export const Cymatics = () =>
  new Pattern("Cymatics", cymatics, {
    // u_palette: {
    //   name: "Palette",
    //   value: new Palette(
    //     new Vector3(0.261, 0.446, 0.315),
    //     new Vector3(0.843, 0.356, 0.239),
    //     new Vector3(0.948, 1.474, 1.361),
    //     new Vector3(3.042, 5.63, 5.424),
    //   ),
    // },
    u_n: {
      name: "N",
      value: 1.0,
      min: 0.0,
      max: 10.0,
    },
    u_m: {
      name: "M",
      value: 5.0,
      min: 0.0,
      max: 10.0,
    },
    u_L: {
      name: "L",
      value: 1.0,
      min: 0.1,
      max: 10.0,
    },
    u_offsetX: {
      name: "Offset X",
      value: 0.0,
      min: -1.0,
      max: 1.0,
    },
    u_offsetY: {
      name: "Offset Y",
      value: 0.0,
      min: -1.0,
      max: 1.0,
    },
  });
