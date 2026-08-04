import { Pattern } from "@/src/types/Pattern";
import trailsFrag from "./shaders/trails.frag";
import { FeedbackComponent } from "@/src/effects/FeedbackComponent";

export { trailsFrag };
export const Trails = () =>
  new Pattern(
    "Trails",
    trailsFrag,
    {
      u_amount: {
        name: "Amount",
        value: 0.7,
        min: 0,
        max: 1,
      },
    },
    ["v_normalized_uv"],
    FeedbackComponent,
  );
