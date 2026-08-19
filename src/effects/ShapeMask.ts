import { Pattern } from "@/src/types/Pattern";

import shapeMask from "@/src/effects/shaders/shapeMask.frag";

export { shapeMask };
export const ShapeMask = () =>
  new Pattern(
    "Shape Mask",
    shapeMask,
    {
      u_inner_radius: {
        name: "Inner radius",
        value: 0,
        min: 0,
        max: 1,
        step: 0.01,
      },
      // Data name kept as u_radius for backwards compatibility; displayed as
      // "Outer radius" now that an inner radius exists.
      u_radius: {
        name: "Outer radius",
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
      },
      u_theta_min: {
        name: "Theta min",
        value: 0,
        min: 0,
        max: 360,
        step: 1,
      },
      u_theta_max: {
        name: "Theta max",
        value: 360,
        min: 0,
        max: 360,
        step: 1,
      },
      u_inverse: {
        name: "Inverse",

        value: 0,
        step: 1,
      },
      // Twists the mask's own angular coordinate (proportional to radius),
      // independent of the Twist pattern -- that one distorts the sampled
      // image itself, this only distorts where the mask boundary falls.
      // 0 = no twist, matching legacy behavior for existing experiences.
      u_mask_twist: {
        name: "Twist",
        value: 0,
        min: -2,
        max: 2,
      },
    },
    ["v_uv", "v_normalized_uv"],
  );
