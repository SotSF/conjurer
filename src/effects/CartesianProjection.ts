import { Pattern } from "@/src/types/Pattern";
import cartesianProjection from "./shaders/cartesianProjection.frag";

export { cartesianProjection };
export const CartesianProjection = () =>
  new Pattern(
    "Cartesian Proj",
    cartesianProjection,
    {
      u_cartesianness: { name: "Cartesianness", value: 0.5 },
    },
    ["v_normalized_uv"],
  );
