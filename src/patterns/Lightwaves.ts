import { Pattern } from "@/src/types/Pattern";
import { Palette } from "@/src/types/Palette";
import { Vector3 } from "three";

import lightwaves from "@/src/patterns/shaders/lightwaves.frag";

export { lightwaves };
export const Lightwaves = () =>
  new Pattern("Lightwaves", lightwaves, {
    u_intensity: {
      name: "Intensity",
      value: 0
    },
    u_timeFactor: {
      name: "Time Factor",
      value: 0
    },
    u_period: {
      name: "Period",
      value: 0
    },
    u_palette: {
      name: "Palette",
      value: new Palette(
        new Vector3(0.261, 0.446, 0.315),
        new Vector3(0.843, 0.356, 0.239),
        new Vector3(0.948, 1.474, 1.361),
        new Vector3(3.042, 5.63, 5.424)
      ),
    },
  });
