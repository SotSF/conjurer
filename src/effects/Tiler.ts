import { Pattern } from "@/src/types/Pattern";
import tiler from "./shaders/tiler.frag";

export { tiler };
export const Tiler = () =>
  new Pattern("Tiler", tiler, {
    u_tiling: {
      name: "Tiling",
      value: 3,
      max: 15,
      step: 1,
    },
    u_cell_scale: {
      name: "Cell Scale",
      value: 1,
      max: 5,
    },
    u_rotation: {
      name: "Rotation",
      value: 0,
      max: 2,
    },
    u_rotation_rate: {
      name: "Rotation Rate",
      value: 0,
    },
    u_cell_rotation: {
      name: "Cell Rotation",
      value: 0,
      max: 2,
    },
    u_cell_rotation_rate: {
      name: "Cell Rotation Rate",
      value: 0,
    },
  });
