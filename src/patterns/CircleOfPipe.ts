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
        new Vector3(
          0.38012185644181273,
          0.04951178654967059,
          0.34059431907804383
        ),
        new Vector3(
          0.22842685967042442,
          0.9069932128688625,
          0.9174834753698677
        ),
        new Vector3(0.758210629593248, 0.6346634079299964, 0.7528808866039169),
        new Vector3(0.3050300091631708, 0.06872971318578447, 0.830521052272386)
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
    u_camera_y: {
      name: "Camera Y",
      value: 0,
      min: -50,
      max: 50,
    },
    u_camera_distance: {
      name: "Camera Distance",
      value: 9,
      min: 0,
      max: 50,
    },
    u_camera_rotation_factor: {
      name: "Camera Rotation Factor",
      value: 0.5,
      min: -2,
      max: 2,
    },

    u_rust_threshold: {
      name: "Rust Threshold",
      value: -10,
      min: -50,
      max: 50,
    },
    u_cell_size: {
      name: "Cell Size",
      value: 1.5,
      min: 0.1,
      max: 5,
    },
    u_cells_per_second: {
      name: "Cells Per Second",
      value: 2,
      min: 0,
      max: 10,
    },
    u_repeat_count: {
      name: "Repeat Count",
      value: 5,
      min: 1,
      max: 10,
      step: 1,
    },
  });
