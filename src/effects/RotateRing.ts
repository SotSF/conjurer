import { Pattern } from "@/src/types/Pattern";
import rotateRing from "./shaders/rotateRing.frag";

export { rotateRing };
export const RotateRing = () =>
  new Pattern("RotateRing", rotateRing, {
    u_inner_radius: {
      name: "Inner Radius",
      value: 0.2,
      min: 0,
      max: 1,
    },
    u_outer_radius: {
      name: "Outer Radius",
      value: 0.5,
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
