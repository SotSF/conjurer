import { Pattern } from "@/src/types/Pattern";

export const Opacity = () =>
  new Pattern("Opacity", "", {
    u_opacity: {
      name: "Opacity",
      value: 1,
    },
  });
