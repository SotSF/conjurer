import { Pattern } from "@/src/types/Pattern";
import chromaticAberration from "./shaders/chromaticAberration.frag";
import { Vector4 } from "three";

export const ChromaticAberration = () =>
  new Pattern("Chromatic Aberration", chromaticAberration, {
    u_theta: {
      name: "theta",
      value: 0,
    },
    u_mag_r: {
      name: "R Magnitude",
      value: -0.1,
    },
    u_mag_g: {
      name: "G Magnitude",
      value: 0.3,
    },
    u_mag_b: {
      name: "B Magnitude",
      value: 0.2,
    },
  });
