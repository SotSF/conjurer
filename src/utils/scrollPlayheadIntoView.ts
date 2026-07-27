import { debounce } from "lodash";

/** Scroll the timeline so the playhead is centered in view. */
export const scrollPlayheadIntoView = debounce(
  () =>
    document.getElementById("playhead")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    }),
  20,
  { leading: false, trailing: true },
);
