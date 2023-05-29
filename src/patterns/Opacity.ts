import { Pattern } from "@/src/types/Pattern";

// TODO: Need to think through a better abstraction for this
export const Opacity = () =>
  new Pattern("Opacity", "", {
    u_opacity: {
      name: "Opacity",
      value: 1,
    },
  });
