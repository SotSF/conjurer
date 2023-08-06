import { Pattern } from "@/src/types/Pattern";
import shaper from "./shaders/shaper.frag";

export { shaper };
export const Shaper = () =>
  new Pattern("Shaper", shaper, {
    u_tiling: {
      name: "Tiling",
      value: 8,
      min: 1,
      max: 15,
      step: 1,
    },
    u_rotation: {
      name: "Rotation",
      value: 0,
    },
    u_box_size: {
      name: "Box Size",
      value: 0.6,
    },
    u_circle_size: {
      name: "Circle Size",
      value: 0.5,
    },
    u_box_smooth: {
      name: "Box Smooth",
      value: 0.01,
    },
    u_circle_smooth: {
      name: "Circle Smooth",
      value: 0.0,
    },
    u_brick_offset_x: {
      name: "Brick Offset X",
      value: 0.0,
      step: 1,
      max: 3,
    },
    u_brick_offset_y: {
      name: "Brick Offset Y",
      value: 0.0,
      step: 1,
      max: 3,
    },
  });
