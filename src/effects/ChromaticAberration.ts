import { Pattern } from "@/src/types/Pattern";
import chromaticAberration from "./shaders/chromaticAberration.frag";

export { chromaticAberration };
export const ChromaticAberration = () =>
  new Pattern(
    "Chromatic Aberration",
    chromaticAberration,
    {
      u_theta: {
        name: "Theta",
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
    },
    true
  );
