import { Pattern } from "@/src/types/Pattern";
import twist from "./shaders/twist.frag";

export { twist };
export const Twist = () =>
  new Pattern("Twist", twist, {
    u_amount: {
      name: "Amount",
      value: 0.5,
      min: -2,
      max: 2,
    },
  });
