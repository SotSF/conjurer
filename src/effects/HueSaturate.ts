import { Pattern } from "@/src/types/Pattern";
import hueSaturate from "./shaders/hueSaturate.frag";

export { hueSaturate };
export const HueSaturate = () =>
  new Pattern(
    "Hue Saturate",
    hueSaturate,
    {
      u_hue_shift: {
        name: "Hue Shift",
        value: 0,
        min: 0,
        max: 1,
        step: 0.01,
      },
      u_saturation: {
        name: "Saturation",
        value: 1,
        min: 0,
        max: 2,
        step: 0.01,
      },
    },
    ["v_normalized_uv"],
  );
