import { Pattern } from "@/src/types/Pattern";
import colorTint from "./shaders/colorTint.frag";
import { Vector4 } from "three";

export { colorTint };
export const ColorTint = () =>
  new Pattern("Color Tint", colorTint, {
    u_red: {
      name: "R",
      value: 1.0,
    },
    u_green: {
      name: "G",
      value: 0.0,
    },
    u_blue: {
      name: "B",
      value: 0.0,
    },
    u_intensity: {
      name: "Intensity",
      value: 0.3,
    },
  });
