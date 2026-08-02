import { Pattern } from "@/src/types/Pattern";
import trailsFrag from "./shaders/trails.frag";
import { TrailsComponent } from "@/src/effects/TrailsComponent";

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
    TrailsComponent,
  );
