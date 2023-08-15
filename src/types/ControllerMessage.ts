import { TransferBlock } from "@/src/types/TransferBlock";

export type ControllerMessage =
  | {
      type: "connect";
      context: string;
    }
  | { type: "updateBlock"; transferBlock: TransferBlock };
