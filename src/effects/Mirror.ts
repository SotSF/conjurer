import { Pattern } from "@/src/types/Pattern";
import mirror from "./shaders/mirror.frag";

export { mirror };
export const Mirror = () =>
  new Pattern("Mirror", mirror, {
    u_mirrorCount: {
      name: "Mirror Count",
      value: 2,
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
