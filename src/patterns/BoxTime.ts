import { Pattern } from "@/src/types/Pattern";
import { Palette } from "@/src/types/Palette";
import { Vector3 } from "three";

import boxTime from "@/src/patterns/shaders/boxTime.frag";

export { boxTime };
export const BoxTime = () =>
  new Pattern("BoxTime", boxTime, {
    u_palette: {
      name: "Palette",
      value: new Palette(
        new Vector3(0.577, 0.918, 0.918),
        new Vector3(0.821, 0.51, 0.082),
        new Vector3(0.711, 0.871, 0.58),
        new Vector3(0.72, 0.452, 0.129)
      ),
    },
  });
