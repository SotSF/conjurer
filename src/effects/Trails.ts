import { Pattern } from "@/src/types/Pattern";
import trailsFrag from "./shaders/trails.frag";
import { TrailsBlockNode } from "@/src/effects/TrailsBlockNode";

export { trailsFrag };
export const Trails = () =>
  new Pattern(
    "Trails",
    trailsFrag,
    {
      u_amount: {
        name: "Amount",
        value: 1,
        min: 0,
        max: 1,
      },
    },
    ["v_normalized_uv"],
    TrailsBlockNode,
  );
