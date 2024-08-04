import { Vector3 } from "three";

import spaceOdyssey from "@/src/patterns/shaders/spaceOdyssey.frag";
import { Pattern } from "@/src/types/Pattern";
import { Palette } from "@/src/types/Palette";

export { spaceOdyssey };
export const SpaceOdyssey = () =>
  new Pattern("SpaceOdyssey", spaceOdyssey, {
    u_palette: {
      name: "Palette",
      value: new Palette(
        new Vector3(0.261, 0.446, 0.315),
        new Vector3(0.843, 0.356, 0.239),
        new Vector3(0.948, 1.474, 1.361),
        new Vector3(3.042, 5.63, 5.424)
      ),
    },
    u_iterations: {
      name: "Iterations",
      value: 4,
    },
    u_exponent: {
      name: "Exponent",
      value: 1.2,
    },
    u_color_change_rate: {
      name: "Color Change Rate",
      value: 0.4,
    },
  });
