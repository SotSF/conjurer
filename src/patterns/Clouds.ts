import { Pattern } from "@/src/types/Pattern";
import clouds from "./shaders/clouds.frag";
import { Vector4 } from "three";

export { clouds };
export const Clouds = () =>
  new Pattern("Clouds", clouds, {
    u_scale: {
      name: "Scale",
      value: 0.5,
    },
    u_speed: {
      name: "Speed",
      value: 1,
    },
    u_high_pass: {
      name: "High Pass",
      value: 0,
    },
    u_threshold_size: {
      name: "Threshold Size",
      value: 0.15,
    },
    u_color: {
      name: "Color",
      value: new Vector4(1, 1, 1, 1),
    },
  });
