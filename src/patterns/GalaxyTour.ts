import { Pattern } from "@/src/types/Pattern";
import { Vector4 } from "three";

import galaxyTour from "@/src/patterns/shaders/galaxyTour.frag";

export { galaxyTour };
export const GalaxyTour = () =>
  new Pattern("GalaxyTour", galaxyTour, {
    u_iterations: {
      name: "Star Density",
      value: 12,
      min: 1,
      max: 40,
    },
    u_magic: {
      name: "Magic",
      value: 0.79,
      min: 0,
      max: 1.2,
    },
    u_dark_stars: {
      name: "Dark Stars",
      value: 0,
      min: 0,
      max: 1,
      step: 1,
    },
    u_zoom: {
      name: "Zoom",
      value: 1.0,
      min: 0.1,
      max: 5,
    },
    u_step_size: {
      name: "Step Size",
      value: 0.29,
      min: 0.001,
      max: 1,
    },
    u_speed: {
      name: "Forward Speed",
      value: 0.2,
      min: 0.1,
      max: 4,
    },
    u_transverse_speed: {
      name: "Transverse Speed",
      value: 1,
      min: -10,
      max: 10,
    },
    u_brightness: {
      name: "Brightness",
      value: 1.5,
      min: 0,
      max: 100,
    },
    u_visible_distance: {
      name: "Visible Distance",
      value: 7,
      min: 1,
      max: 10,
      step: 1,
    },
    u_dist_fading: {
      name: "Distance Fading",
      value: 0.56,
      min: 0,
      max: 1,
    },
    u_saturation: {
      name: "Saturation",
      value: 0.9,
      min: 0,
      max: 1,
    },
    u_cloud: {
      name: "Cloud",
      value: 0.17,
      min: 0,
      max: 1,
    },
    u_cloud_color: {
      name: "Cloud Color",
      value: new Vector4(0.05, 0, 1.8),
    },
  });
