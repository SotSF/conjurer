import { Pattern } from "@/src/types/Pattern";
import { Palette } from "@/src/types/Palette";
import { Vector3 } from "three";

import turbine from "@/src/patterns/shaders/turbine.frag";

export { turbine };
export const Turbine = () =>
  new Pattern("Turbine", turbine, {
    u_palette: {
      name: "Palette",
      value: new Palette(
        new Vector3(0.4, 0.18151, 0.82081),
        new Vector3(0.30995, 0.43477, 0.2783),
        new Vector3(1, 1, 1),
        new Vector3(0.33107, 0.79852, 0.1234)
      ),
    },
    u_time_offset: {
      name: "Time Offset",
      value: 0,
      min: -100,
      max: 100,
    },
    u_speed: {
      name: "Speed",
      value: 0.3,
      min: -1,
      max: 1,
    },
    u_tail_length: {
      name: "Tail Length",
      value: 0.33,
      min: 0,
      max: 1,
    },
    u_blade_count: {
      name: "Blade Count",
      value: 3,
      min: 1,
      max: 10,
      step: 1,
    },
    u_bladient: {
      name: "Bladient",
      value: 1,
      min: 0,
      max: 1,
      step: 1,
    },
    u_blade_arc: {
      name: "Blade Arc",
      value: 0.2,
      min: -1,
      max: 1,
    },
  });
