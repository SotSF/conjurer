import { Pattern } from "@/src/types/Pattern";
import { Palette } from "@/src/types/Palette";
import { Vector3 } from "three";

import circleOfPipe from "@/src/patterns/shaders/circleOfPipe.frag";

export { circleOfPipe };
export const CircleOfPipe = () =>
  new Pattern("CircleOfPipe", circleOfPipe, {
    u_palette: {
      name: "Palette",
      value: new Palette(
        new Vector3(0.7285298697969937, 0.6228059132971426, 0.5429350952854446),
        new Vector3(
          0.1503807548191285,
          0.7592828790122585,
          0.34797927599424816
        ),
        new Vector3(
          0.3808609223727044,
          0.40832368287880505,
          0.7756747974006282
        ),
        new Vector3(0.7711916470325293, 0.972910878683034, 0.9122259421196939)
      ),
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
