import { Pattern } from "@/src/types/Pattern";
import convergence from "./shaders/convergence.frag";
import { Vector4 } from "three";

export { convergence };
export const Convergence = () =>
  new Pattern("Convergence", convergence, {
    u_color: {
      name: "Color",
      value: new Vector4(1, 1, 1, 1),
    },
    u_radius: {
      name: "Radius",
      value: 0.5,
    },
    u_fuzziness: {
      name: "Fuzziness",
      value: 0.2,
    },
  });
