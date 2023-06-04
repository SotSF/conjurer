import { Pattern } from "@/src/types/Pattern";
import rotate from "./shaders/rotate.frag";

export const Rotate = () =>
  new Pattern("Rotate", rotate, {
    u_speed: {
      name: "Speed",
      value: 5,
    },
    u_offset: {
      name: "Offset",
      value: 0,
    },
  });
