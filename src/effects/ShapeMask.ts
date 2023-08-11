import { Pattern } from "@/src/types/Pattern";

import shapeMask from "@/src/effects/shaders/shapeMask.frag";

export { shapeMask };
export const ShapeMask = () =>
  new Pattern("Shape Mask", shapeMask, {
    u_radius: {
      name: "Radius",
      value: 0.5,
    },
    u_inverse: {
      name: "Inverse",

      value: 0,
      step: 1,
    },
  });
