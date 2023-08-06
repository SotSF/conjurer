import { Pattern } from "@/src/types/Pattern";
import globules from "./shaders/globules.frag";

export { globules };
export const Globules = () =>
  new Pattern("Globules", globules, {
    u_time_factor: {
      name: "Time Factor",
      value: 1,
      max: 5,
    },
    u_time_offset: {
      name: "Time Offset",
      value: 0,
      min: -5,
      max: 5,
    },
  });
