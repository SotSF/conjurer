import { Pattern } from "@/src/types/Pattern";
import rainbow from "./shaders/rainbow.frag";

export { rainbow };
export const Rainbow = () =>
  new Pattern("Rainbow", rainbow, {
    u_time_factor: {
      name: "Time Factor",
      value: 1,
    },
    u_time_offset: {
      name: "Time Offset",
      value: 0,
    },
  });
