import { Pattern } from "@/src/types/Pattern";
import sunCycle from "./shaders/sunCycle.frag";

export { sunCycle };
export const SunCycle = () =>
  new Pattern("Sun Cycle", sunCycle, {
    u_time_factor: {
      name: "Time Factor",
      value: 1,
    },
    u_time_offset: {
      name: "Time Offset",
      value: 0,
    },
  });
