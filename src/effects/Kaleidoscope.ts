import { Pattern } from "@/src/types/Pattern";
import kaleidoscope from "./shaders/kaleidoscope.frag";

export { kaleidoscope };
export const Kaleidoscope = () =>
  new Pattern("Kaleidoscope", kaleidoscope, {
    u_reflectCount: {
      name: "Reflections",
      value: 4,
      min: 1,
      max: 16,
      step: 1
    }
  });
