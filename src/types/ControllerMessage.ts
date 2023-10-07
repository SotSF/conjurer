import { SerializedBlock } from "@/src/types/Block";

export type ControllerMessage =
  | {
      type: "connect";
      context: string;
    }
  | { type: "updateBlock"; serializedBlock: SerializedBlock };
