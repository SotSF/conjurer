import { Pattern } from "@/src/types/Pattern";
import fire from "./shaders/fire.frag";

export { fire };
export const Fire = () =>
  new Pattern("Fire", fire, {
    u_fire_power: {
      name: "Fire Power",
      value: 0.5,
      step: 0.01,
    },
    u_fade_factor: {
      name: "Fade Factor",
      value: 0.05,
      step: 0.01,
    },
    u_time_factor: {
      name: "Time Factor",
      value: 1,
      min: -5,
      max: 5,
    },
    u_time_offset: {
      name: "Time Offset",
      value: 0,
      min: -5,
      max: 5,
    },
  });
