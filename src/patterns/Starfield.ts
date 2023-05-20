import { Pattern } from "@/src/types/Pattern";
import starfield from "./shaders/starfield.frag";

export const Starfield = () =>
  new Pattern("Starfield", starfield, {
    u_time_factor: {
      name: "Time Factor",
      value: 1,
    },
    u_time_offset: {
      name: "Time Offset",
      value: 0,
    },
  });
