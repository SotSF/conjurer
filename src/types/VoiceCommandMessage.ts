type VoiceCommandConnectMessage = {
  type: "connect";
  appId: "conjurer";
};

export type VoiceCommandActionMessage = {
  type: "action";
} & (
  | { action: "togglePlay" | "goToBeginning" | "goToEnd" }
  | { action: "selectLayer"; value: number }
);

export type VoiceCommandMessage =
  | VoiceCommandConnectMessage
  | VoiceCommandActionMessage;
