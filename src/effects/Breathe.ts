import { Pattern } from "@/src/types/Pattern";
import breathe from "./shaders/breathe.frag";

export { breathe };
export const Breathe = () =>
  new Pattern("Breathe", breathe, {
    u_offset: {
      name: "Offset",
      value: 0,
      min: -2,
      max: 2,
    },
    u_amplitude: {
      name: "Amplitude",
      value: 0.4,
      min: 0,
      max: 2,
    },
    u_speed: {
      name: "Speed",
      value: 0.5,
      min: 0,
      max: 4,
    },
    u_phase: {
      name: "Phase",
      value: 0,
      min: 0,
      max: 2,
    },
  });
