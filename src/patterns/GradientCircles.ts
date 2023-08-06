import { Pattern } from "@/src/types/Pattern";
import gradientCircles from "./shaders/gradientCircles.frag";
import { Palette } from "../types/Palette";
import { Vector3 } from "three";

export { gradientCircles };
export const GradientCircles = () =>
  new Pattern("Gradient Circles", gradientCircles, {
    u_palette: {
      name: "Palette",
      value: new Palette(
        new Vector3(0.5, 0.5, 0.5),
        new Vector3(0.5, 0.5, 0.194),
        new Vector3(1.0, 0.608, 1.0),
        new Vector3(0.468, 0.198, 0.557)
      ),
    },
    u_count: {
      name: "Count",
      value: 8,
      min: 1,
      max: 20,
      step: 1,
    },
    u_offset: {
      name: "Offset",
      value: 0.4,
      min: -2,
      max: 2,
    },
    u_radius: {
      name: "Radius",
      value: 0.6,
      max: 2,
    },
    u_colorShift: {
      name: "Color Shift",
      value: 1.0,
    },
    u_clockwise: {
      name: "Clockwise?",
      value: 0,
      step: 1,
    },
  });
