import { Pattern } from "@/src/types/Pattern";
import rotate from "./shaders/rotate.frag";

export { rotate };
export const Rotate = () =>
  new Pattern("Rotate", rotate, {
    u_inner_radius: {
      name: "Inner Radius",
      value: 0,
      min: 0,
      max: 1,
    },
    u_outer_radius: {
      name: "Outer Radius",
      value: 1,
      min: 0,
      max: 1,
    },
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
  });
