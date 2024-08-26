import { Pattern } from "@/src/types/Pattern";
import rotate from "./shaders/rotate.frag";

export { rotate };
export const Rotate = () =>
  new Pattern(
    "Rotate",
    rotate,
    {
      u_speed: {
        name: "Speed",
        value: 5,
        max: 10,
      },
      u_offset: {
        name: "Offset",
        value: 0,
        min: -5,
        max: 5,
      },
    },
    true
  );
