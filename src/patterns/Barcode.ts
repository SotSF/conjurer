import { Pattern } from "@/src/types/Pattern";
import barcode from "./shaders/barcode.frag";

export { barcode };
export const Barcode = () =>
  new Pattern("Barcode", barcode, {
    u_segments: {
      name: "Segments",

      value: 4,
    },
    u_stutter_frequency: {
      name: "Stutter Frequency",
      value: 0.8,
    },
    u_go_nuts: {
      name: "Go Nuts",
      value: 0,
    },
    u_saturation_start: {
      name: "Saturation Start",
      value: 1.0,
    },
    u_hue_start: {
      name: "Hue Start",
      value: 0.05,
    },
    u_hue_width: {
      name: "Hue Width",
      value: 0.55,
    },
  });
