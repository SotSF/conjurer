import { Pattern } from "@/src/types/Pattern";
import leaf from "./shaders/leaf.frag";

export { leaf };
export const Leaf = () =>
  new Pattern(
    "Leaf",
    leaf,
    {
      u_time_factor: {
        name: "Time Factor",
        value: 1,
        max: 5,
      },
      u_time_offset: {
        name: "Time Offset",
        value: 0,
        min: -5,
        max: 5,
      },
      u_tiling: {
        name: "Tiling",
        value: 1,
        min: 1,
        max: 10,
        step: 1,
      },
      u_coordinate_offset: {
        name: "Coordinate Offset",
        value: 0.5,
      },
    },
    ["v_uv", "v_normalized_uv"],
  );
