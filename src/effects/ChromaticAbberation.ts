import { Pattern } from "@/src/types/Pattern";
import chromaticAbberation from "./shaders/chromaticAbberation.frag";
import { Vector4 } from "three";

export const ChromaticAbberation = () =>
  new Pattern("Chromatic Abberation", chromaticAbberation, {
    u_mag_r: {
      name: "R Magnitude",
      value: -0.1,
    },
    u_mag_g: {
      name: "G Magnitude",
      value: 0.03,
    },
    u_mag_b: {
      name: "B Magnitude",
      value: 0.2,
    },
  });
