import { Pattern } from "@/src/types/Pattern";
import colorTint from "./shaders/colorTint.frag";
import { Vector4 } from "three";

export { colorTint };
export const ColorTint = () =>
  new Pattern("Color Tint", colorTint, {
    u_color: {
      name: "Color",
      value: new Vector4(1, 0, 0, 1),
    },
    u_intensity: {
      name: "Intensity",
      value: 0.3,
    },
  });
