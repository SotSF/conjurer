import { Pattern } from "@/src/types/Pattern";
import clouds from "./shaders/clouds.frag";
import { Vector4 } from "three";

export { clouds };
export const Clouds = () =>
  new Pattern("Clouds", clouds, {
    u_color: {
      name: "Color",
      value: new Vector4(1, 1, 1, 1),
    },
    u_scale: {
      name: "Scale",
      value: 0.5,
    },
    u_speed: {
      name: "Speed",
      value: 1,
    },
  });
