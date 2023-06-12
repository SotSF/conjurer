import { Pattern } from "@/src/types/Pattern";
import cartesianProjection from "./shaders/cartesianProjection.frag";

export { cartesianProjection };
export const CartesianProjection = () =>
  new Pattern("Cartesian Proj", cartesianProjection);
