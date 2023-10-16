import { Pattern } from "@/src/types/Pattern";
import { Palette } from "@/src/types/Palette";
import { Vector3 } from "three";

import pipeTime from "@/src/patterns/shaders/pipeTime.frag";

export { pipeTime };
export const PipeTime = () =>
  new Pattern("PipeTime", pipeTime, {
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
  });
