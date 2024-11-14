import { Pattern } from "@/src/types/Pattern";
import brightnessAdjust from "./shaders/brightnessAdjust.frag";

export { brightnessAdjust };
export const BrightnessAdjust = () =>
  new Pattern(
    "Brightness Adjust",
    brightnessAdjust,
    {
      u_intensity: {
        name: "Intensity",
        value: 1,
      },
    },
    ["v_normalized_uv"],
  );
