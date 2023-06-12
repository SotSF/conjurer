import { Pattern } from "@/src/types/Pattern";
import melt from "./shaders/melt.frag";

export { melt };
export const Melt = () =>
  new Pattern("Melt", melt, {
    u_time_factor: {
      name: "Time Factor",
      value: 1,
    },
    u_time_offset: {
      name: "Time Offset",
      value: 0,
    },
    u_rotation_speed: {
      name: "Rotation Speed",
      value: 4,
    },
  });
