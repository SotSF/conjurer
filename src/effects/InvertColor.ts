import { Pattern } from "@/src/types/Pattern";
import invertColor from "./shaders/invertColor.frag";

export { invertColor };
export const InvertColor = () =>
  new Pattern(
    "Invert Color",
    invertColor,
    {
      u_amount: {
        name: "Amount",
        value: 1,
        min: 0,
        max: 1,
      },
    },
    ["v_normalized_uv"],
  );
