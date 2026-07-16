import { Pattern } from "@/src/types/Pattern";
import threshold from "./shaders/threshold.frag";

export { threshold };
export const Threshold = () =>
  new Pattern(
    "Threshold",
    threshold,
    {
      u_threshold: {
        name: "Threshold",
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
      },
    },
    ["v_normalized_uv"],
  );
