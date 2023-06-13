import { Pattern } from "@/src/types/Pattern";
import tiler from "./shaders/tiler.frag";

export { tiler };
export const Tiler = () =>
  new Pattern("Tiler", tiler, {
    u_tiling: {
      name: "Tiling",
      value: 3,
    },
    u_cell_scale: {
      name: "Cell Scale",
      value: 1,
    },
    u_rotation: {
      name: "Rotation",
      value: 0,
    },
    u_rotation_rate: {
      name: "Rotation Rate",
      value: 0,
    },
    u_cell_rotation: {
      name: "Cell Rotation",
      value: 0,
    },
    u_cell_rotation_rate: {
      name: "Cell Rotation Rate",
      value: 0,
    },
  });
