import { Pattern } from "@/src/types/Pattern";
import { FeedbackComponent } from "@/src/effects/FeedbackComponent";
import videoFeedbackFrag from "./shaders/videoFeedback.frag";

export { videoFeedbackFrag };
export const VideoFeedback = () =>
  new Pattern(
    "Video Feedback",
    videoFeedbackFrag,
    {
      u_amount: {
        name: "Amount",
        value: 0.7,
        min: 0,
        max: 1,
      },
      u_scale: {
        name: "Scale",
        value: 1.01,
        min: 0.5,
        max: 2,
        step: 0.001,
      },
      u_rotation: {
        name: "Rotation",
        value: 45,
        min: -90,
        max: 90,
        step: 1,
      },
    },
    ["v_normalized_uv"],
    FeedbackComponent,
  );
