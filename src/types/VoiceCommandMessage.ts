type VoiceCommandConnectMessage = {
  type: "connect";
  appId: "conjurer";
};

export type VoiceCommandActionMessage = {
  type: "action";
} & ( // Actions without arguments
  | { action: "togglePlay" | "goToBeginning" | "goToEnd" }
  // Actions with arguments
  | {
      action:
        | "selectLayer"
        | "goToTime"
        | "moveBlockForwardRelative"
        | "moveBlockBackwardRelative";
      value: number;
    }
);

export type VoiceCommandMessage =
  | VoiceCommandConnectMessage
  | VoiceCommandActionMessage;
