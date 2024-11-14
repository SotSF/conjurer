import { Pattern } from "@/src/types/Pattern";
import { Palette } from "@/src/types/Palette";
import { Vector3 } from "three";

import gentleRings from "@/src/patterns/shaders/gentleRings.frag";

export { gentleRings };
export const GentleRings = () =>
  new Pattern("GentleRings", gentleRings, {
    u_palette: {
      name: "Palette",
      value: new Palette(
        new Vector3(0.5, 0.5, 0.5),
        new Vector3(0.5, 0.5, 0.5),
        new Vector3(1, 1, 1),
        new Vector3(0, 0.33, 0.67),
      ),
    },
  });
