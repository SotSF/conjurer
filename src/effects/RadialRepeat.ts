import { Pattern } from "@/src/types/Pattern";
import radialRepeat from "./shaders/radialRepeat.frag";

export { radialRepeat };
export const RadialRepeat = () =>
  new Pattern("Radial Repeat", radialRepeat, {
    u_repeatCount: {
      name: "Repeat Count",
      value: 4,
      min: 2,
      max: 16,
      step: 1,
    },
    u_angle: {
      name: "Angle",
      value: 0,
      min: 0,
      max: 2,
    },
  });
