export type ControllerMessage =
  | {
      type: "connect";
    }
  | { type: "update" };
