import { Pattern } from "@/src/types/Pattern";
import cloudsMask from "./shaders/cloudsMask.frag";

export { cloudsMask };
export const CloudsMask = () =>
  new Pattern(
    "Clouds Mask",
    cloudsMask,
    {
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
    },
    ["v_normalized_uv"],
  );
