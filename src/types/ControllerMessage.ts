import { TransferBlock } from "@/src/types/TransferBlock";

export type ControllerMessage =
  | {
      type: "connect";
    }
  | { type: "updateBlock"; transferBlock: TransferBlock };
